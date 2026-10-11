/**
 * Moteur pur du tableau de bord "groupe" — agrège les indicateurs clés de
 * plusieurs entreprises appartenant au même utilisateur, SANS remplacer une
 * consolidation comptable réelle (pas d'élimination des flux intragroupe, pas
 * de retraitement des méthodes comptables) : un simple regroupement des
 * chiffres déjà calculés par chaque entreprise individuellement.
 *
 * Point critique : les entreprises n'ont AUCUNE garantie de partager la même
 * devise (`currency` est un champ libre par entreprise). Sommer aveuglément
 * across devises produirait un total sans signification. L'agrégation se fait
 * donc TOUJOURS par groupe de devise, jamais une somme globale unique.
 */

export interface CompanyIndicators {
  companyId: string;
  companyName: string;
  currency: string;
  cashBalance: number;
  revenueYTD: number;
  activeEmployeeCount: number;
}

export interface CurrencyGroup {
  currency: string;
  totalCashBalance: number;
  totalRevenueYTD: number;
  totalActiveEmployeeCount: number;
  companies: CompanyIndicators[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Regroupe les indicateurs de plusieurs entreprises par devise — jamais de
 * somme entre devises différentes. Un utilisateur possédant des entreprises en
 * KMF et en XOF verra deux groupes distincts, chacun avec son propre total. */
export function groupIndicatorsByCurrency(
  companies: CompanyIndicators[],
): CurrencyGroup[] {
  const groups = new Map<string, CurrencyGroup>();

  for (const company of companies) {
    if (!groups.has(company.currency)) {
      groups.set(company.currency, {
        currency: company.currency,
        totalCashBalance: 0,
        totalRevenueYTD: 0,
        totalActiveEmployeeCount: 0,
        companies: [],
      });
    }
    const group = groups.get(company.currency)!;
    group.totalCashBalance = round2(
      group.totalCashBalance + company.cashBalance,
    );
    group.totalRevenueYTD = round2(group.totalRevenueYTD + company.revenueYTD);
    group.totalActiveEmployeeCount += company.activeEmployeeCount;
    group.companies.push(company);
  }

  return [...groups.values()].sort(
    (a, b) => b.totalCashBalance - a.totalCashBalance,
  );
}
