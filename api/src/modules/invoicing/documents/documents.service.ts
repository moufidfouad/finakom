import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { companyMemberWhereNested } from "@/utils/authContext";
import { getMemberCompanyOrThrow } from "@/modules/companies/companies.service";
import { assertCanModifyOwnedResource } from "@/utils/resourceOwnership";
import { getOrCreateSettings } from "@/modules/invoicing/settings/settings.service";
import {
  computeDocumentTotals,
  computePaymentSummary,
} from "@/modules/invoicing/engine/documentEngine";
import { getNextDocumentNumber } from "./documentSequence.service";
import {
  CreateDocumentInput,
  STATUS_BY_TYPE,
  UpdateDocumentInput,
} from "./documents.schemas";
import { recordAuditLog } from "@/modules/auditLog/auditLog.service";

const DOCUMENT_INCLUDE = {
  client: true,
  lines: { orderBy: { lineOrder: "asc" as const } },
  payments: { orderBy: { date: "asc" as const } },
  createdBy: { select: { id: true, email: true, fullName: true } },
};

type DocumentWithRelations = Awaited<
  ReturnType<typeof getOwnedDocumentOrThrow>
>;

/** Attache les totaux calculés (HT/TVA/TTC) et, pour une Facture, le résumé des
 * paiements — en tenant compte des avoirs (notes de crédit) liés à cette
 * facture exactement comme des paiements : un avoir réduit le solde dû de la
 * même façon qu'un règlement, sans en être un au sens comptable. */
async function withComputedTotals(doc: DocumentWithRelations) {
  const lines = doc.lines.map((l: DocumentWithRelations["lines"][number]) => ({
    quantity: Number(l.quantity),
    unitPriceHT: Number(l.unitPriceHT),
  }));
  const totals = computeDocumentTotals(lines, Number(doc.tvaRatePercent));

  if (doc.type !== "Facture") {
    return { ...doc, totals, paymentSummary: null };
  }

  const creditNotes = await prisma.salesDocument.findMany({
    where: { type: "Avoir", linkedInvoiceId: doc.id },
    include: { lines: true },
  });
  const creditNoteAmounts = creditNotes.map(
    (cn: (typeof creditNotes)[number]) =>
      computeDocumentTotals(
        cn.lines.map((l: (typeof cn.lines)[number]) => ({
          quantity: Number(l.quantity),
          unitPriceHT: Number(l.unitPriceHT),
        })),
        Number(cn.tvaRatePercent),
      ).totalTTC,
  );

  const payments = doc.payments.map(
    (p: DocumentWithRelations["payments"][number]) => Number(p.amount),
  );
  const paymentSummary = computePaymentSummary(totals.totalTTC, [
    ...payments,
    ...creditNoteAmounts,
  ]);
  return { ...doc, totals, paymentSummary };
}

/** Accès en lecture : tout membre de l'entreprise (créateur, ADMIN, MEMBER, ou SUPERADMIN). */
export async function getOwnedDocumentOrThrow(
  documentId: string,
  auth: AuthenticatedUser,
) {
  const document = await prisma.salesDocument.findFirst({
    where: { id: documentId, ...companyMemberWhereNested(auth) },
    include: DOCUMENT_INCLUDE,
  });
  if (!document) throw AppError.notFound("Document introuvable");
  return document;
}

/**
 * Autorise la MODIFICATION d'un document (statut, livraison, suppression, export
 * PDF) uniquement à son créateur, à l'administrateur de l'entreprise, ou au
 * SUPERADMIN — un simple membre ne peut pas modifier le document d'un collègue.
 */
async function assertCanModifyDocument(
  document: { companyId: string; createdById: string | null },
  auth: AuthenticatedUser,
): Promise<void> {
  await assertCanModifyOwnedResource(document, auth, {
    errorMessage:
      "Seul le créateur de ce document, un administrateur de l'entreprise, ou le super-administrateur peut le modifier.",
  });
}

export async function getDocument(documentId: string, auth: AuthenticatedUser) {
  const doc = await getOwnedDocumentOrThrow(documentId, auth);
  return await withComputedTotals(doc);
}

export async function listDocuments(
  companyId: string,
  auth: AuthenticatedUser,
  filters: { type?: string; status?: string } = {},
) {
  await getMemberCompanyOrThrow(companyId, auth);
  const documents = await prisma.salesDocument.findMany({
    where: { companyId, ...(filters.type ? { type: filters.type } : {}) },
    include: DOCUMENT_INCLUDE,
    orderBy: { date: "desc" },
  });
  const withTotals = await Promise.all(
    documents.map((d: (typeof documents)[number]) => withComputedTotals(d)),
  );
  if (!filters.status) return withTotals;

  return withTotals.filter((d: (typeof withTotals)[number]) => {
    const effectiveStatus =
      d.type === "Facture" ? d.paymentSummary?.status : d.status;
    return effectiveStatus === filters.status;
  });
}

async function resolveLines(
  companyId: string,
  input: CreateDocumentInput["lines"],
) {
  const resolved = [];
  for (const [index, line] of input.entries()) {
    if (line.productId) {
      const product = await prisma.product.findFirst({
        where: { id: line.productId, companyId },
      });
      if (!product)
        throw AppError.badRequest(
          `Article introuvable dans le catalogue de l'entreprise (ligne ${index + 1})`,
        );
      resolved.push({
        productId: product.id,
        designation: line.designation ?? product.designation,
        quantity: line.quantity,
        unitPriceHT: line.unitPriceHT ?? Number(product.sellingPriceHT),
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
  if (type === "Devis") return "Envoyé";
  if (type === "Bon de livraison") return "En préparation";
  return "Impayée"; // Facture
}

export async function createDocument(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateDocumentInput,
) {
  await getMemberCompanyOrThrow(companyId, auth);

  const client = await prisma.client.findFirst({
    where: { id: input.clientId, companyId },
  });
  if (!client)
    throw AppError.badRequest(
      "Client introuvable dans le répertoire de l'entreprise",
    );

  if (input.linkedQuoteId) {
    const quote = await prisma.salesDocument.findFirst({
      where: { id: input.linkedQuoteId, companyId, type: "Devis" },
    });
    if (!quote) throw AppError.badRequest("Devis lié introuvable");
  }

  if (input.type === "Avoir") {
    const invoice = await prisma.salesDocument.findFirst({
      where: { id: input.linkedInvoiceId, companyId, type: "Facture" },
    });
    if (!invoice)
      throw AppError.badRequest(
        "Facture d'origine introuvable pour cet avoir.",
      );
    if (invoice.clientId !== input.clientId) {
      throw AppError.badRequest(
        "L'avoir doit concerner le même client que la facture d'origine.",
      );
    }
  }

  const settings = await getOrCreateSettings(companyId);
  const number = await getNextDocumentNumber(companyId, input.type);
  const lines = await resolveLines(companyId, input.lines);

  const document = await prisma.salesDocument.create({
    data: {
      companyId,
      type: input.type,
      number,
      clientId: input.clientId,
      date: input.date,
      status: defaultStatusFor(input.type),
      tvaRatePercent: settings.tvaRatePercent,
      linkedQuoteId: input.linkedQuoteId,
      linkedInvoiceId: input.linkedInvoiceId,
      createdById: auth.userId,
      notes: input.notes,
      lines: { create: lines },
    },
    include: DOCUMENT_INCLUDE,
  });

  const withTotals = await withComputedTotals(document);
  if (document.type === "Facture") {
    await postSaleEntryBestEffort(
      document.companyId,
      document.id,
      document.date,
      document.number,
      withTotals.totals,
      auth.userId,
    );
  }
  if (document.type === "Avoir" && input.linkedInvoiceId) {
    await postCreditNoteEntryBestEffort(
      document.companyId,
      document.id,
      document.date,
      document.number,
      withTotals.totals,
      auth.userId,
    );
    await refreshInvoiceStatus(input.linkedInvoiceId);
  }

  await recordAuditLog({
    companyId,
    userId: auth.userId,
    action: "CREATE",
    entityType: "SalesDocument",
    entityId: document.id,
    entityLabel: `${document.type} ${document.number}`,
    summary: `Créé : ${lines.length} ligne(s), ${withTotals.totals.totalTTC.toLocaleString("fr-FR")} TTC`,
  });

  return withTotals;
}

/**
 * Contre-passe automatiquement la vente (411 Clients / 701 ou 706 Ventes / 4431
 * TVA collectée) à l'émission d'une facture. Best-effort : si le plan comptable
 * de l'entreprise n'a pas encore de compte configuré pour un rôle requis
 * (CLIENTS, VENTES_MARCHANDISES...), on journalise un avertissement plutôt que
 * de bloquer la création de la facture — une entreprise qui n'a pas encore mis
 * en place sa comptabilité générale doit quand même pouvoir facturer normalement.
 */
async function postSaleEntryBestEffort(
  companyId: string,
  documentId: string,
  date: Date,
  documentNumber: string,
  totals: { totalHT: number; totalTVA: number; totalTTC: number },
  createdById: string,
) {
  try {
    const { buildSaleEntryLines } =
      await import("@/modules/accounting/engine/postingEngine");
    const { postAutoEntry } =
      await import("@/modules/accounting/journalEntries/journalEntries.service");
    await postAutoEntry({
      companyId,
      journal: "VENTES",
      date,
      label: `Facture ${documentNumber}`,
      sourceType: "SalesDocument",
      sourceId: documentId,
      createdById,
      lines: buildSaleEntryLines(totals),
    });
  } catch (err) {
    console.warn(
      `⚠️  Contre-passation comptable non effectuée pour la facture ${documentNumber} :`,
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Contre-passe automatiquement l'avoir (701/706 Ventes / 4431 TVA collectée au
 * débit, 411 Clients au crédit) — l'inverse exacte de la vente d'origine,
 * best-effort comme le reste des contre-passations automatiques de ce module.
 */
async function postCreditNoteEntryBestEffort(
  companyId: string,
  documentId: string,
  date: Date,
  documentNumber: string,
  totals: { totalHT: number; totalTVA: number; totalTTC: number },
  createdById: string,
) {
  try {
    const { buildCreditNoteEntryLines } =
      await import("@/modules/accounting/engine/postingEngine");
    const { postAutoEntry } =
      await import("@/modules/accounting/journalEntries/journalEntries.service");
    await postAutoEntry({
      companyId,
      journal: "VENTES",
      date,
      label: `Avoir ${documentNumber}`,
      sourceType: "SalesDocument",
      sourceId: documentId,
      createdById,
      lines: buildCreditNoteEntryLines(totals),
    });
  } catch (err) {
    console.warn(
      `⚠️  Contre-passation comptable non effectuée pour l'avoir ${documentNumber} :`,
      err instanceof Error ? err.message : err,
    );
  }
}

/** Convertit un Devis "Accepté" en Facture, en reprenant client + lignes. */
export async function convertQuoteToInvoice(
  quoteId: string,
  auth: AuthenticatedUser,
) {
  const quote = await getOwnedDocumentOrThrow(quoteId, auth);
  if (quote.type !== "Devis")
    throw AppError.badRequest("Seul un devis peut être converti en facture");
  if (quote.status !== "Accepté") {
    throw AppError.badRequest(
      'Le devis doit être au statut "Accepté" avant conversion en facture',
    );
  }

  const settings = await getOrCreateSettings(quote.companyId);
  const number = await getNextDocumentNumber(quote.companyId, "Facture");

  const invoice = await prisma.salesDocument.create({
    data: {
      companyId: quote.companyId,
      type: "Facture",
      number,
      clientId: quote.clientId,
      date: new Date(),
      status: "Impayée",
      tvaRatePercent: settings.tvaRatePercent,
      linkedQuoteId: quote.id,
      createdById: auth.userId,
      lines: {
        create: quote.lines.map(
          (l: DocumentWithRelations["lines"][number]) => ({
            productId: l.productId,
            designation: l.designation,
            quantity: l.quantity,
            unitPriceHT: l.unitPriceHT,
            observation: l.observation,
            lineOrder: l.lineOrder,
          }),
        ),
      },
    },
    include: DOCUMENT_INCLUDE,
  });

  const withTotals = await withComputedTotals(invoice);
  await postSaleEntryBestEffort(
    invoice.companyId,
    invoice.id,
    invoice.date,
    invoice.number,
    withTotals.totals,
    auth.userId,
  );
  return withTotals;
}

/**
 * Crée un Bon de livraison à partir du contenu d'une Facture existante (même
 * client, mêmes lignes — quantités reprises comme quantités à livrer). Le BL
 * reste indépendant : livrer ses lignes ne modifie pas la facture d'origine.
 */
export async function createDeliveryNoteFromInvoice(
  invoiceId: string,
  auth: AuthenticatedUser,
) {
  const invoice = await getOwnedDocumentOrThrow(invoiceId, auth);
  if (invoice.type !== "Facture") {
    throw AppError.badRequest(
      "Seule une facture peut servir de base à un bon de livraison",
    );
  }

  const settings = await getOrCreateSettings(invoice.companyId);
  const number = await getNextDocumentNumber(
    invoice.companyId,
    "Bon de livraison",
  );

  const deliveryNote = await prisma.salesDocument.create({
    data: {
      companyId: invoice.companyId,
      type: "Bon de livraison",
      number,
      clientId: invoice.clientId,
      date: new Date(),
      status: "En préparation",
      tvaRatePercent: settings.tvaRatePercent,
      linkedInvoiceId: invoice.id,
      createdById: auth.userId,
      lines: {
        create: invoice.lines.map(
          (l: DocumentWithRelations["lines"][number]) => ({
            productId: l.productId,
            designation: l.designation,
            quantity: l.quantity,
            unitPriceHT: l.unitPriceHT,
            observation: l.observation,
            lineOrder: l.lineOrder,
          }),
        ),
      },
    },
    include: DOCUMENT_INCLUDE,
  });

  return await withComputedTotals(deliveryNote);
}

/**
 * Modifie le client, la date, les notes et/ou les lignes d'un document existant
 * (client/date/notes toujours modifiables ; les lignes sont remplacées en bloc,
 * comme pour la balance comptable — une seule source de vérité, jamais de
 * fusion partielle ambiguë). Garde-fous métier :
 *  - Facture avec au moins un paiement enregistré → lignes verrouillées (modifier
 *    les montants facturés après encaissement rendrait le paiement incohérent).
 *  - Bon de livraison avec au moins une ligne déjà livrée → lignes verrouillées
 *    (des mouvements de stock ont déjà été générés à partir d'elles).
 */
export async function updateDocument(
  documentId: string,
  auth: AuthenticatedUser,
  input: UpdateDocumentInput,
) {
  const document = await getOwnedDocumentOrThrow(documentId, auth);
  await assertCanModifyDocument(document, auth);

  if (input.lines) {
    if (document.type === "Facture" && document.payments.length > 0) {
      throw AppError.badRequest(
        "Cette facture a déjà au moins un paiement enregistré : ses lignes ne peuvent plus être modifiées (annulez le paiement si une correction est indispensable).",
      );
    }
    if (
      document.type === "Bon de livraison" &&
      document.lines.some(
        (l: DocumentWithRelations["lines"][number]) =>
          Number(l.quantityDelivered ?? 0) > 0,
      )
    ) {
      throw AppError.badRequest(
        "Ce bon de livraison a déjà des lignes livrées (mouvements de stock générés) : ses lignes ne peuvent plus être modifiées.",
      );
    }
    if (document.type === "Avoir") {
      throw AppError.badRequest(
        "Un avoir déjà émis ne peut plus être modifié (son écriture comptable est postée dès la création) — émettez un nouvel avoir ou une note de régularisation si nécessaire.",
      );
    }
  }

  if (input.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, companyId: document.companyId },
    });
    if (!client)
      throw AppError.badRequest(
        "Client introuvable dans le répertoire de l'entreprise",
      );
  }

  const lines = input.lines
    ? await resolveLines(document.companyId, input.lines)
    : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    if (lines) {
      await tx.salesDocumentLine.deleteMany({ where: { documentId } });
      await tx.salesDocumentLine.createMany({
        data: lines.map((l) => ({ ...l, documentId })),
      });
    }
    return tx.salesDocument.update({
      where: { id: documentId },
      data: {
        ...(input.clientId ? { clientId: input.clientId } : {}),
        ...(input.date ? { date: input.date } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: DOCUMENT_INCLUDE,
    });
  });

  const withTotals = await withComputedTotals(updated);
  await recordAuditLog({
    companyId: document.companyId,
    userId: auth.userId,
    action: "UPDATE",
    entityType: "SalesDocument",
    entityId: documentId,
    entityLabel: `${document.type} ${document.number}`,
    summary: lines
      ? `Modifié : lignes remplacées (${lines.length} ligne(s), ${withTotals.totals.totalTTC.toLocaleString("fr-FR")} TTC)`
      : "Modifié : informations générales (client, date ou notes)",
  });

  return withTotals;
}

export async function updateStatus(
  documentId: string,
  auth: AuthenticatedUser,
  status: string,
) {
  const document = await getOwnedDocumentOrThrow(documentId, auth);
  await assertCanModifyDocument(document, auth);

  if (document.type === "Facture") {
    throw AppError.badRequest(
      "Le statut d'une facture est calculé automatiquement à partir des paiements enregistrés — enregistrez un paiement plutôt que de modifier le statut manuellement.",
    );
  }

  const allowed = STATUS_BY_TYPE[document.type as keyof typeof STATUS_BY_TYPE];
  if (!allowed.includes(status)) {
    throw AppError.badRequest(
      `Statut invalide pour un document de type "${document.type}". Valeurs possibles : ${allowed.join(", ")}`,
    );
  }

  const updated = await prisma.salesDocument.update({
    where: { id: documentId },
    data: { status },
    include: DOCUMENT_INCLUDE,
  });
  return await withComputedTotals(updated);
}

/**
 * Met à jour la quantité livrée d'une ligne de Bon de livraison. Si l'article est
 * suivi en inventaire, génère automatiquement le mouvement de stock correspondant
 * (uniquement sur le delta par rapport à la quantité précédemment livrée, pour
 * rester correct en cas de correction).
 */
export async function deliverLine(
  documentId: string,
  lineId: string,
  auth: AuthenticatedUser,
  quantityDelivered: number,
) {
  const document = await getOwnedDocumentOrThrow(documentId, auth);
  await assertCanModifyDocument(document, auth);
  if (document.type !== "Bon de livraison") {
    throw AppError.badRequest(
      "Seule une ligne de bon de livraison peut être marquée comme livrée",
    );
  }

  const line = document.lines.find(
    (l: DocumentWithRelations["lines"][number]) => l.id === lineId,
  );
  if (!line) throw AppError.notFound("Ligne introuvable sur ce document");

  const previousQuantity = Number(line.quantityDelivered ?? 0);
  const delta = quantityDelivered - previousQuantity;

  await prisma.$transaction(async (tx) => {
    await tx.salesDocumentLine.update({
      where: { id: lineId },
      data: { quantityDelivered },
    });

    if (line.productId && delta !== 0) {
      const product = await tx.product.findUnique({
        where: { id: line.productId },
      });
      if (product?.trackInventory) {
        await tx.stockMovement.create({
          data: {
            productId: line.productId,
            date: document.date,
            type: delta > 0 ? "Sortie" : "Entrée",
            quantity: Math.abs(delta),
            reference: document.number,
          },
        });
      }
    }
  });

  return getDocument(documentId, auth);
}

export async function deleteDocument(
  documentId: string,
  auth: AuthenticatedUser,
) {
  const document = await getOwnedDocumentOrThrow(documentId, auth);
  await assertCanModifyDocument(document, auth);

  await prisma.$transaction(async (tx) => {
    if (document.type === "Bon de livraison") {
      await tx.stockMovement.deleteMany({
        where: { reference: document.number },
      });
    }
    await tx.salesDocument.delete({ where: { id: documentId } });
  });

  if (document.type === "Avoir" && document.linkedInvoiceId) {
    await refreshInvoiceStatus(document.linkedInvoiceId);
  }

  await recordAuditLog({
    companyId: document.companyId,
    userId: auth.userId,
    action: "DELETE",
    entityType: "SalesDocument",
    entityId: documentId,
    entityLabel: `${document.type} ${document.number}`,
    summary: `Supprimé (client : ${document.client?.name ?? "inconnu"})`,
  });
}

/**
 * Recalcule et persiste le statut de paiement d'une facture, en tenant compte
 * à la fois des paiements ET des avoirs liés (voir withComputedTotals — même
 * logique de calcul, dupliquée ici uniquement parce qu'il faut PERSISTER le
 * résultat en base, pas seulement le renvoyer). Exportée depuis ce fichier
 * (plutôt que définie dans payments.service.ts, qui l'appelait jusqu'ici en
 * privé) pour que le module Avoir puisse aussi l'appeler sans créer de cycle
 * d'import — documents.service.ts est la source de vérité pour SalesDocument,
 * payments.service.ts en dépend déjà, jamais l'inverse.
 */
export async function refreshInvoiceStatus(documentId: string) {
  const document = await prisma.salesDocument.findUniqueOrThrow({
    where: { id: documentId },
    include: { lines: true, payments: true },
  });

  const totals = computeDocumentTotals(
    document.lines.map((l: (typeof document.lines)[number]) => ({
      quantity: Number(l.quantity),
      unitPriceHT: Number(l.unitPriceHT),
    })),
    Number(document.tvaRatePercent),
  );

  const creditNotes = await prisma.salesDocument.findMany({
    where: { type: "Avoir", linkedInvoiceId: documentId },
    include: { lines: true },
  });
  const creditNoteAmounts = creditNotes.map(
    (cn: (typeof creditNotes)[number]) =>
      computeDocumentTotals(
        cn.lines.map((l: (typeof cn.lines)[number]) => ({
          quantity: Number(l.quantity),
          unitPriceHT: Number(l.unitPriceHT),
        })),
        Number(cn.tvaRatePercent),
      ).totalTTC,
  );

  const summary = computePaymentSummary(totals.totalTTC, [
    ...document.payments.map((p: (typeof document.payments)[number]) =>
      Number(p.amount),
    ),
    ...creditNoteAmounts,
  ]);

  await prisma.salesDocument.update({
    where: { id: documentId },
    data: { status: summary.status },
  });
  return summary;
}

export { assertCanModifyDocument };
