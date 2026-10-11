import { prisma } from '@/config/prisma';
import { AppError } from '@/utils/AppError';
import { AuthenticatedUser } from '@/types/express';
import { getOwnedPurchaseDocumentOrThrow, assertCanModifyPurchaseDocument } from '@/modules/purchasing/documents/purchaseDocuments.service';
import { assertCanModifyOwnedResource } from '@/utils/resourceOwnership';
import { computeDocumentTotals, computePaymentSummary } from '@/modules/invoicing/engine/documentEngine';
import { CreateSupplierPaymentInput } from './supplierPayments.schemas';

async function refreshSupplierInvoiceStatus(documentId: string) {
  const document = await prisma.purchaseDocument.findUniqueOrThrow({
    where: { id: documentId },
    include: { lines: true, payments: true },
  });
  const totals = computeDocumentTotals(
    document.lines.map((l: (typeof document.lines)[number]) => ({ quantity: Number(l.quantity), unitPriceHT: Number(l.unitPriceHT) })),
    Number(document.tvaRatePercent)
  );
  const summary = computePaymentSummary(
    totals.totalTTC,
    document.payments.map((p: (typeof document.payments)[number]) => Number(p.amount))
  );
  await prisma.purchaseDocument.update({ where: { id: documentId }, data: { status: summary.status } });
  return summary;
}

export async function listSupplierPayments(documentId: string, auth: AuthenticatedUser) {
  await getOwnedPurchaseDocumentOrThrow(documentId, auth);
  return prisma.supplierPayment.findMany({ where: { documentId }, orderBy: { date: 'asc' } });
}

/** Enregistrer un règlement modifie l'état de la facture fournisseur : réservé créateur/admin/superadmin. */
export async function createSupplierPayment(documentId: string, auth: AuthenticatedUser, input: CreateSupplierPaymentInput) {
  const document = await getOwnedPurchaseDocumentOrThrow(documentId, auth);
  await assertCanModifyPurchaseDocument(document, auth);
  if (document.type !== 'Facture fournisseur') {
    throw AppError.badRequest('Seule une facture fournisseur peut recevoir un règlement');
  }

  const payment = await prisma.supplierPayment.create({ data: { ...input, documentId } });
  await refreshSupplierInvoiceStatus(documentId);
  await postSupplierPaymentEntryBestEffort(document.companyId, payment.id, payment.date, document.number, Number(payment.amount), payment.method, auth.userId);
  return payment;
}

/** Contre-passe automatiquement le règlement (401 Fournisseurs / Banque ou Caisse) — best-effort, symétrique de payments.service.ts côté ventes. */
async function postSupplierPaymentEntryBestEffort(
  companyId: string, paymentId: string, date: Date, documentNumber: string, amount: number, method: string | null, createdById: string
) {
  try {
    const { buildSupplierPaymentEntryLines } = await import('@/modules/accounting/engine/postingEngine');
    const { postAutoEntry } = await import('@/modules/accounting/journalEntries/journalEntries.service');
    const toBank = method !== 'Espèces';
    await postAutoEntry({
      companyId,
      journal: toBank ? 'BANQUE' : 'CAISSE',
      date,
      label: `Règlement facture fournisseur ${documentNumber}`,
      sourceType: 'SupplierPayment',
      sourceId: paymentId,
      createdById,
      lines: buildSupplierPaymentEntryLines({ amount, toBank }),
    });
  } catch (err) {
    console.warn(`⚠️  Contre-passation comptable non effectuée pour le règlement fournisseur ${documentNumber} :`, err instanceof Error ? err.message : err);
  }
}

export async function deleteSupplierPayment(paymentId: string, auth: AuthenticatedUser) {
  const payment = await prisma.supplierPayment.findUnique({ where: { id: paymentId }, include: { document: true } });
  if (!payment) throw AppError.notFound('Règlement introuvable');

  await assertCanModifyOwnedResource(payment.document, auth, { errorMessage: 'Règlement introuvable', onDenied: 'notFound' });

  await prisma.supplierPayment.delete({ where: { id: paymentId } });
  await refreshSupplierInvoiceStatus(payment.documentId);
}
