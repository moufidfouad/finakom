import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { computeCashPosition } from "@/modules/treasury/engine/treasuryEngine";
import { getOrCreateTreasurySettings } from "@/modules/treasury/settings/settings.service";
import { computeDocumentTotals } from "@/modules/invoicing/engine/documentEngine";
import {
  CompanyIndicators,
  groupIndicatorsByCurrency,
} from "./groupDashboardEngine";

/**
 * Tableau de bord "groupe" — agrège les indicateurs clés des entreprises
 * POSSÉDÉES par l'utilisateur (jamais celles où il n'est que membre, ex: un
 * comptable invité sur l'entreprise d'un tiers ne doit pas la voir apparaître
 * dans son propre tableau de bord). Regroupé par devise (voir groupDashboardEngine.ts) —
 * ne constitue pas une consolidation comptable réelle (pas d'élimination des
 * flux intragroupe), seulement un regroupement des chiffres déjà calculés
 * individuellement par chaque entreprise.
 */
export async function getGroupDashboard(auth: AuthenticatedUser) {
  const companies = await prisma.company.findMany({
    where: { userId: auth.userId },
  });
  if (companies.length === 0) return { currencyGroups: [], companyCount: 0 };

  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const yearEnd = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

  const indicators: CompanyIndicators[] = await Promise.all(
    companies.map(
      async (
        company: (typeof companies)[number],
      ): Promise<CompanyIndicators> => {
        const [
          treasuryEntries,
          treasurySettings,
          invoices,
          activeEmployeeCount,
        ] = await Promise.all([
          prisma.treasuryEntry.findMany({ where: { companyId: company.id } }),
          getOrCreateTreasurySettings(company.id),
          prisma.salesDocument.findMany({
            where: {
              companyId: company.id,
              type: "Facture",
              date: { gte: yearStart, lte: yearEnd },
            },
            include: { lines: true },
          }),
          prisma.employee.count({
            where: { companyId: company.id, status: "Actif" },
          }),
        ]);

        const movements = treasuryEntries.map(
          (e: (typeof treasuryEntries)[number]) => ({
            date: e.date,
            type: e.type as "Encaissement" | "Décaissement",
            amount: Number(e.amount),
            support: e.support,
            category: e.category,
          }),
        );
        const position = computeCashPosition(
          movements,
          Number(treasurySettings.openingCashBalance),
          Number(treasurySettings.openingBankBalance),
        );

        const revenueYTD = invoices.reduce(
          (sum: number, doc: (typeof invoices)[number]) => {
            const totals = computeDocumentTotals(
              doc.lines.map((l: (typeof doc.lines)[number]) => ({
                quantity: Number(l.quantity),
                unitPriceHT: Number(l.unitPriceHT),
              })),
              Number(doc.tvaRatePercent),
            );
            return sum + totals.totalHT;
          },
          0,
        );

        return {
          companyId: company.id,
          companyName: company.name,
          currency: company.currency,
          cashBalance: position.totalBalance,
          revenueYTD,
          activeEmployeeCount,
        };
      },
    ),
  );

  return {
    currencyGroups: groupIndicatorsByCurrency(indicators),
    companyCount: companies.length,
  };
}
