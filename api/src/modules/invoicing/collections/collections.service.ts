import { prisma } from '@/config/prisma';
import { AuthenticatedUser } from '@/types/express';
import { getOwnedCompanyOrThrow } from '@/modules/companies/companies.service';
import { computeDocumentTotals, computePaymentSummary } from '@/modules/invoicing/engine/documentEngine';
import { buildAgingReport, InvoiceForAging } from './collectionsEngine';

/** Accès réservé aux administrateurs de l'entreprise — même politique que le
 * tableau de bord facturation (getInvoicingDashboard) : ce rapport agrège les
 * impayés de TOUS les clients, pas seulement les documents du membre courant. */
export async function getCollectionsReport(companyId: string, auth: AuthenticatedUser) {
  await getOwnedCompanyOrThrow(companyId, auth);

  const invoices = await prisma.salesDocument.findMany({
    where: { companyId, type: 'Facture' },
    include: { lines: true, payments: true, client: { select: { id: true, name: true } } },
  });

  const forAging: InvoiceForAging[] = invoices.map((inv: (typeof invoices)[number]) => {
    const totals = computeDocumentTotals(
      inv.lines.map((l: (typeof inv.lines)[number]) => ({ quantity: Number(l.quantity), unitPriceHT: Number(l.unitPriceHT) })),
      Number(inv.tvaRatePercent)
    );
    const summary = computePaymentSummary(totals.totalTTC, inv.payments.map((p: (typeof inv.payments)[number]) => Number(p.amount)));
    return {
      invoiceId: inv.id, invoiceNumber: inv.number, partyId: inv.client?.id ?? '', partyName: inv.client?.name ?? '—',
      date: inv.date, status: summary.status, remaining: summary.remaining,
    };
  });

  return buildAgingReport(forAging, new Date());
}
