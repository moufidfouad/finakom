import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import {
  getOwnedDocumentOrThrow,
  assertCanModifyDocument,
  refreshInvoiceStatus,
} from "@/modules/invoicing/documents/documents.service";
import { assertCanModifyOwnedResource } from "@/utils/resourceOwnership";
import { CreatePaymentInput } from "./payments.schemas";

export async function listPayments(
  documentId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedDocumentOrThrow(documentId, auth);
  return prisma.payment.findMany({
    where: { documentId },
    orderBy: { date: "asc" },
  });
}

/** Enregistrer un paiement modifie l'état de la facture : réservé créateur/admin/superadmin, comme les autres mutations de document. */
export async function createPayment(
  documentId: string,
  auth: AuthenticatedUser,
  input: CreatePaymentInput,
) {
  const document = await getOwnedDocumentOrThrow(documentId, auth);
  await assertCanModifyDocument(document, auth);
  if (document.type !== "Facture") {
    throw AppError.badRequest("Seule une facture peut recevoir un paiement");
  }

  const payment = await prisma.payment.create({
    data: { ...input, documentId },
  });
  await refreshInvoiceStatus(documentId);
  await postPaymentEntryBestEffort(
    document.companyId,
    payment.id,
    payment.date,
    document.number,
    Number(payment.amount),
    payment.method,
    auth.userId,
  );
  return payment;
}

/**
 * Contre-passe automatiquement l'encaissement (Banque ou Caisse au débit / 411
 * Clients au crédit) à l'enregistrement d'un paiement — best-effort, mêmes
 * principes que postSaleEntryBestEffort côté facturation : un plan comptable
 * pas encore configuré ne doit jamais empêcher d'enregistrer un règlement reçu.
 */
async function postPaymentEntryBestEffort(
  companyId: string,
  paymentId: string,
  date: Date,
  documentNumber: string,
  amount: number,
  method: string | null,
  createdById: string,
) {
  try {
    const { buildPaymentEntryLines } =
      await import("@/modules/accounting/engine/postingEngine");
    const { postAutoEntry } =
      await import("@/modules/accounting/journalEntries/journalEntries.service");
    const toBank = method !== "Espèces";
    await postAutoEntry({
      companyId,
      journal: toBank ? "BANQUE" : "CAISSE",
      date,
      label: `Règlement facture ${documentNumber}`,
      sourceType: "Payment",
      sourceId: paymentId,
      createdById,
      lines: buildPaymentEntryLines({ amount, toBank }),
    });
  } catch (err) {
    console.warn(
      `⚠️  Contre-passation comptable non effectuée pour le paiement de la facture ${documentNumber} :`,
      err instanceof Error ? err.message : err,
    );
  }
}

export async function deletePayment(
  paymentId: string,
  auth: AuthenticatedUser,
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { document: true },
  });
  if (!payment) throw AppError.notFound("Paiement introuvable");

  await assertCanModifyOwnedResource(payment.document, auth, {
    errorMessage: "Paiement introuvable",
    onDenied: "notFound",
  });

  await prisma.payment.delete({ where: { id: paymentId } });
  await refreshInvoiceStatus(payment.documentId);
}
