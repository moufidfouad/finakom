import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import {
  computeDocumentTotals,
  computePaymentSummary,
} from "@/modules/invoicing/engine/documentEngine";
import { getOwnedClientOrThrow } from "@/modules/invoicing/clients/clients.service";
import { computeCreditStatus } from "./creditLimitEngine";

/**
 * Encours actuel d'un client — somme des restes dus sur toutes ses factures
 * non soldées (Impayée ou Partielle). Réutilise les mêmes moteurs purs que le
 * reste du module facturation (computeDocumentTotals, computePaymentSummary),
 * y compris les avoirs déjà déduits du solde de chaque facture.
 */
export async function getClientOutstanding(clientId: string): Promise<number> {
  const invoices = await prisma.salesDocument.findMany({
    where: { clientId, type: "Facture" },
    include: { lines: true, payments: true },
  });

  let totalOutstanding = 0;
  for (const invoice of invoices) {
    const totals = computeDocumentTotals(
      invoice.lines.map((l: (typeof invoice.lines)[number]) => ({
        quantity: Number(l.quantity),
        unitPriceHT: Number(l.unitPriceHT),
      })),
      Number(invoice.tvaRatePercent),
    );

    const creditNotes = await prisma.salesDocument.findMany({
      where: { type: "Avoir", linkedInvoiceId: invoice.id },
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

    const payments = invoice.payments.map(
      (p: (typeof invoice.payments)[number]) => Number(p.amount),
    );
    const summary = computePaymentSummary(totals.totalTTC, [
      ...payments,
      ...creditNoteAmounts,
    ]);
    totalOutstanding += Math.max(0, summary.remaining); // jamais négatif (un client qui a trop payé n'a pas un encours négatif)
  }

  return totalOutstanding;
}

/**
 * Vérifie si une nouvelle facture d'un montant donné ferait dépasser la
 * limite d'encours du client — jamais bloquant, uniquement informatif (voir
 * creditLimitEngine.ts). Appelé par le frontend AVANT de soumettre une
 * facture, pour proposer une confirmation à l'utilisateur si le seuil est dépassé.
 */
export async function getClientCreditStatus(
  clientId: string,
  auth: AuthenticatedUser,
  newInvoiceAmount: number,
) {
  const client = await getOwnedClientOrThrow(clientId, auth);

  const currentOutstanding = await getClientOutstanding(clientId);
  return computeCreditStatus(
    client.creditLimit ? Number(client.creditLimit) : null,
    currentOutstanding,
    newInvoiceAmount,
  );
}
