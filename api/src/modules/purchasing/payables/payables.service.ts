import { prisma } from '@/config/prisma';
import { AuthenticatedUser } from '@/types/express';
import { getOwnedCompanyOrThrow } from '@/modules/companies/companies.service';
import { computeDocumentTotals, computePaymentSummary } from '@/modules/invoicing/engine/documentEngine';
import { buildAgingReport, InvoiceForAging } from '@/modules/invoicing/collections/collectionsEngine';

/**
 * Balance âgée des factures fournisseurs non soldées — symétrique du suivi
 * du recouvrement client (invoicing/collections), réutilise le MÊME moteur
 * (collectionsEngine.ts) : les mathématiques sont identiques, seule
 * l'interprétation change ("ce que nous devons" plutôt que "ce qui nous est
 * dû"). Accès réservé aux administrateurs — même politique que le rapport
 * de recouvrement client, un rapport agrégé sur toute l'entreprise.
 */
export async function getPayablesReport(companyId: string, auth: AuthenticatedUser) {
  await getOwnedCompanyOrThrow(companyId, auth);

  const invoices = await prisma.purchaseDocument.findMany({
    where: { companyId, type: 'Facture fournisseur' },
    include: { lines: true, payments: true, supplier: { select: { id: true, name: true } } },
  });

  const forAging: InvoiceForAging[] = invoices.map((inv: (typeof invoices)[number]) => {
    const totals = computeDocumentTotals(
      inv.lines.map((l: (typeof inv.lines)[number]) => ({ quantity: Number(l.quantity), unitPriceHT: Number(l.unitPriceHT) })),
      Number(inv.tvaRatePercent)
    );
    const summary = computePaymentSummary(totals.totalTTC, inv.payments.map((p: (typeof inv.payments)[number]) => Number(p.amount)));
    return {
      invoiceId: inv.id, invoiceNumber: inv.number, partyId: inv.supplier?.id ?? '', partyName: inv.supplier?.name ?? '—',
      date: inv.date, status: summary.status, remaining: summary.remaining,
    };
  });

  return buildAgingReport(forAging, new Date());
}
