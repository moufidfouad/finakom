import { prisma } from '@/config/prisma';
import { AppError } from '@/utils/AppError';
import { AuthenticatedUser } from '@/types/express';
import { companyMemberWhereNested } from '@/utils/authContext';
import { getMemberCompanyOrThrow } from '@/modules/companies/companies.service';
import { assertCanModifyOwnedResource } from '@/utils/resourceOwnership';
import { computeDocumentTotals, computePaymentSummary } from '@/modules/invoicing/engine/documentEngine';
import { getNextPurchaseDocumentNumber } from './purchaseDocumentSequence.service';
import { CreatePurchaseDocumentInput, PURCHASE_STATUS_BY_TYPE, UpdatePurchaseDocumentInput } from './purchaseDocuments.schemas';

const PURCHASE_DOCUMENT_INCLUDE = {
  supplier: true,
  lines: { orderBy: { lineOrder: 'asc' as const } },
  payments: { orderBy: { date: 'asc' as const } },
  createdBy: { select: { id: true, email: true, fullName: true } },
};

type PurchaseDocumentWithRelations = Awaited<ReturnType<typeof getOwnedPurchaseDocumentOrThrow>>;

function withComputedTotals(doc: PurchaseDocumentWithRelations) {
  const lines = doc.lines.map((l: PurchaseDocumentWithRelations['lines'][number]) => ({
    quantity: Number(l.quantity),
    unitPriceHT: Number(l.unitPriceHT),
  }));
  const totals = computeDocumentTotals(lines, Number(doc.tvaRatePercent));

  if (doc.type !== 'Facture fournisseur') {
    return { ...doc, totals, paymentSummary: null };
  }
  const payments = doc.payments.map((p: PurchaseDocumentWithRelations['payments'][number]) => Number(p.amount));
  const paymentSummary = computePaymentSummary(totals.totalTTC, payments);
  return { ...doc, totals, paymentSummary };
}

export async function getOwnedPurchaseDocumentOrThrow(documentId: string, auth: AuthenticatedUser) {
  const document = await prisma.purchaseDocument.findFirst({
    where: { id: documentId, ...companyMemberWhereNested(auth) },
    include: PURCHASE_DOCUMENT_INCLUDE,
  });
  if (!document) throw AppError.notFound('Document introuvable');
  return document;
}

/** Même règle que pour les documents de vente : créateur, admin de l'entreprise, ou superadmin. */
async function assertCanModifyPurchaseDocument(
  document: { companyId: string; createdById: string | null },
  auth: AuthenticatedUser
): Promise<void> {
  await assertCanModifyOwnedResource(document, auth, {
    errorMessage: 'Seul le créateur de ce document, un administrateur de l\'entreprise, ou le super-administrateur peut le modifier.',
  });
}

export async function getPurchaseDocument(documentId: string, auth: AuthenticatedUser) {
  const doc = await getOwnedPurchaseDocumentOrThrow(documentId, auth);
  return withComputedTotals(doc);
}

export async function listPurchaseDocuments(companyId: string, auth: AuthenticatedUser, filters: { type?: string; status?: string } = {}) {
  await getMemberCompanyOrThrow(companyId, auth);
  const documents = await prisma.purchaseDocument.findMany({
    where: { companyId, ...(filters.type ? { type: filters.type } : {}) },
    include: PURCHASE_DOCUMENT_INCLUDE,
    orderBy: { date: 'desc' },
  });
  const withTotals = documents.map((d: (typeof documents)[number]) => withComputedTotals(d));
  if (!filters.status) return withTotals;
  return withTotals.filter((d: (typeof withTotals)[number]) => {
    const effectiveStatus = d.type === 'Facture fournisseur' ? d.paymentSummary?.status : d.status;
    return effectiveStatus === filters.status;
  });
}

async function resolveLines(companyId: string, input: CreatePurchaseDocumentInput['lines']) {
  const resolved = [];
  for (const [index, line] of input.entries()) {
    if (line.productId) {
      const product = await prisma.product.findFirst({ where: { id: line.productId, companyId } });
      if (!product) throw AppError.badRequest(`Article introuvable dans le catalogue de l'entreprise (ligne ${index + 1})`);
      resolved.push({
        productId: product.id,
        designation: line.designation ?? product.designation,
        quantity: line.quantity,
        unitPriceHT: line.unitPriceHT ?? Number(product.unitCost ?? product.sellingPriceHT),
        observation: line.observation,
        lineOrder: index,
      });
    } else {
      resolved.push({
        productId: null,
        designation: line.designation as string,
        quantity: line.quantity,
        unitPriceHT: line.unitPriceHT as number,
        observation: line.observation,
        lineOrder: index,
      });
    }
  }
  return resolved;
}

function defaultStatusFor(type: string): string {
  if (type === 'Bon de commande') return 'Envoyé';
  return 'Impayée'; // Facture fournisseur
}

export async function createPurchaseDocument(companyId: string, auth: AuthenticatedUser, input: CreatePurchaseDocumentInput) {
  await getMemberCompanyOrThrow(companyId, auth);

  const supplier = await prisma.supplier.findFirst({ where: { id: input.supplierId, companyId } });
  if (!supplier) throw AppError.badRequest("Fournisseur introuvable dans le répertoire de l'entreprise");

  if (input.linkedOrderId) {
    const order = await prisma.purchaseDocument.findFirst({ where: { id: input.linkedOrderId, companyId, type: 'Bon de commande' } });
    if (!order) throw AppError.badRequest('Bon de commande lié introuvable');
  }

  const number = await getNextPurchaseDocumentNumber(companyId, input.type);
  const lines = await resolveLines(companyId, input.lines);

  const document = await prisma.purchaseDocument.create({
    data: {
      companyId,
      type: input.type,
      number,
      supplierId: input.supplierId,
      date: input.date,
      status: defaultStatusFor(input.type),
      tvaRatePercent: 18,
      linkedOrderId: input.linkedOrderId,
      createdById: auth.userId,
      notes: input.notes,
      lines: { create: lines },
    },
    include: PURCHASE_DOCUMENT_INCLUDE,
  });

  const withTotals = withComputedTotals(document);
  if (document.type === 'Facture fournisseur') {
    await postPurchaseEntryBestEffort(document.companyId, document.id, document.date, document.number, withTotals.totals, auth.userId);
  }
  return withTotals;
}

/**
 * Contre-passe automatiquement l'achat (601 Achats / 4452 TVA déductible /
 * 401 Fournisseurs) à l'émission d'une facture fournisseur — best-effort,
 * mêmes principes que côté ventes : un plan comptable pas encore configuré ne
 * doit jamais empêcher d'enregistrer une facture fournisseur reçue.
 */
async function postPurchaseEntryBestEffort(
  companyId: string, documentId: string, date: Date, documentNumber: string,
  totals: { totalHT: number; totalTVA: number; totalTTC: number }, createdById: string
) {
  try {
    const { buildPurchaseEntryLines } = await import('@/modules/accounting/engine/postingEngine');
    const { postAutoEntry } = await import('@/modules/accounting/journalEntries/journalEntries.service');
    await postAutoEntry({
      companyId,
      journal: 'ACHATS',
      date,
      label: `Facture fournisseur ${documentNumber}`,
      sourceType: 'PurchaseDocument',
      sourceId: documentId,
      createdById,
      lines: buildPurchaseEntryLines(totals),
    });
  } catch (err) {
    console.warn(`⚠️  Contre-passation comptable non effectuée pour la facture fournisseur ${documentNumber} :`, err instanceof Error ? err.message : err);
  }
}

/** Convertit un Bon de commande "Confirmé" en Facture fournisseur, en reprenant fournisseur + lignes. */
export async function convertOrderToInvoice(orderId: string, auth: AuthenticatedUser) {
  const order = await getOwnedPurchaseDocumentOrThrow(orderId, auth);
  if (order.type !== 'Bon de commande') throw AppError.badRequest('Seul un bon de commande peut être converti en facture fournisseur');
  if (order.status !== 'Confirmé') {
    throw AppError.badRequest('Le bon de commande doit être au statut "Confirmé" avant conversion en facture fournisseur');
  }

  const number = await getNextPurchaseDocumentNumber(order.companyId, 'Facture fournisseur');

  const invoice = await prisma.purchaseDocument.create({
    data: {
      companyId: order.companyId,
      type: 'Facture fournisseur',
      number,
      supplierId: order.supplierId,
      date: new Date(),
      status: 'Impayée',
      tvaRatePercent: order.tvaRatePercent,
      linkedOrderId: order.id,
      createdById: auth.userId,
      lines: {
        create: order.lines.map((l: PurchaseDocumentWithRelations['lines'][number]) => ({
          productId: l.productId,
          designation: l.designation,
          quantity: l.quantity,
          unitPriceHT: l.unitPriceHT,
          observation: l.observation,
          lineOrder: l.lineOrder,
        })),
      },
    },
    include: PURCHASE_DOCUMENT_INCLUDE,
  });

  const withTotals = withComputedTotals(invoice);
  await postPurchaseEntryBestEffort(invoice.companyId, invoice.id, invoice.date, invoice.number, withTotals.totals, auth.userId);
  return withTotals;
}

export async function updatePurchaseDocument(documentId: string, auth: AuthenticatedUser, input: UpdatePurchaseDocumentInput) {
  const document = await getOwnedPurchaseDocumentOrThrow(documentId, auth);
  await assertCanModifyPurchaseDocument(document, auth);

  if (input.lines && document.type === 'Facture fournisseur' && document.payments.length > 0) {
    throw AppError.badRequest(
      'Cette facture fournisseur a déjà au moins un paiement enregistré : ses lignes ne peuvent plus être modifiées.'
    );
  }

  if (input.supplierId) {
    const supplier = await prisma.supplier.findFirst({ where: { id: input.supplierId, companyId: document.companyId } });
    if (!supplier) throw AppError.badRequest("Fournisseur introuvable dans le répertoire de l'entreprise");
  }

  const lines = input.lines ? await resolveLines(document.companyId, input.lines) : undefined;

  const updated = await prisma.$transaction(async (tx: typeof prisma) => {
    if (lines) {
      await tx.purchaseDocumentLine.deleteMany({ where: { documentId } });
      await tx.purchaseDocumentLine.createMany({ data: lines.map((l) => ({ ...l, documentId })) });
    }
    return tx.purchaseDocument.update({
      where: { id: documentId },
      data: {
        ...(input.supplierId ? { supplierId: input.supplierId } : {}),
        ...(input.date ? { date: input.date } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: PURCHASE_DOCUMENT_INCLUDE,
    });
  });

  return withComputedTotals(updated);
}

export async function updatePurchaseStatus(documentId: string, auth: AuthenticatedUser, status: string) {
  const document = await getOwnedPurchaseDocumentOrThrow(documentId, auth);
  await assertCanModifyPurchaseDocument(document, auth);

  if (document.type === 'Facture fournisseur') {
    throw AppError.badRequest(
      "Le statut d'une facture fournisseur est calculé automatiquement à partir des paiements enregistrés."
    );
  }
  const allowed = PURCHASE_STATUS_BY_TYPE[document.type as keyof typeof PURCHASE_STATUS_BY_TYPE];
  if (!allowed.includes(status)) {
    throw AppError.badRequest(`Statut invalide pour un document de type "${document.type}". Valeurs possibles : ${allowed.join(', ')}`);
  }

  const updated = await prisma.purchaseDocument.update({ where: { id: documentId }, data: { status }, include: PURCHASE_DOCUMENT_INCLUDE });
  return withComputedTotals(updated);
}

export async function deletePurchaseDocument(documentId: string, auth: AuthenticatedUser) {
  const document = await getOwnedPurchaseDocumentOrThrow(documentId, auth);
  await assertCanModifyPurchaseDocument(document, auth);
  await prisma.purchaseDocument.delete({ where: { id: documentId } });
}

export { assertCanModifyPurchaseDocument };
