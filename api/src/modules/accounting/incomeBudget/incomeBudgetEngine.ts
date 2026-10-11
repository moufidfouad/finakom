/**
 * Moteur pur de comparaison budget vs réel pour le compte de résultat —
 * réplique le même principe déjà appliqué à la trésorerie (voir
 * treasuryEngine.ts::buildMonthlySchedule), avec une différence structurelle
 * assumée : le compte de résultat n'a PAS de solde cumulé d'un mois à
 * l'autre (contrairement à un solde de trésorerie) — chaque mois y est
 * indépendant, produits et charges du mois uniquement.
 */

export interface IncomeLine {
  month: number; // 1-12
  type: "Produit" | "Charge";
  amount: number;
}

export interface MonthlyIncomeComparison {
  month: number;
  budgetRevenue: number;
  budgetExpense: number;
  budgetResult: number;
  actualRevenue: number;
  actualExpense: number;
  actualResult: number;
  revenueVariance: number; // réel - budget (positif = au-dessus de l'objectif)
  expenseVariance: number; // réel - budget (positif = dépassement)
  resultVariance: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function sumMonth(
  lines: IncomeLine[],
  month: number,
  type: "Produit" | "Charge",
): number {
  return round2(
    lines
      .filter((l) => l.month === month && l.type === type)
      .reduce((s, l) => s + l.amount, 0),
  );
}

export function computeMonthlyIncomeComparison(
  budgetLines: IncomeLine[],
  actualLines: IncomeLine[],
): MonthlyIncomeComparison[] {
  const result: MonthlyIncomeComparison[] = [];

  for (let month = 1; month <= 12; month++) {
    const budgetRevenue = sumMonth(budgetLines, month, "Produit");
    const budgetExpense = sumMonth(budgetLines, month, "Charge");
    const actualRevenue = sumMonth(actualLines, month, "Produit");
    const actualExpense = sumMonth(actualLines, month, "Charge");

    result.push({
      month,
      budgetRevenue,
      budgetExpense,
      budgetResult: round2(budgetRevenue - budgetExpense),
      actualRevenue,
      actualExpense,
      actualResult: round2(actualRevenue - actualExpense),
      revenueVariance: round2(actualRevenue - budgetRevenue),
      expenseVariance: round2(actualExpense - budgetExpense),
      resultVariance: round2(
        actualRevenue - actualExpense - (budgetRevenue - budgetExpense),
      ),
    });
  }

  return result;
}

export interface LedgerLineForIncome {
  classe: string; // premier chiffre du compte ("6" ou "7")
  debit: number;
  credit: number;
}

/**
 * Convertit une ligne d'écriture (débit/crédit) en montant signé de charge
 * ou de produit — extrait à part pour être testable indépendamment de tout
 * accès base de données. Un compte de charge (classe 6) a un solde
 * normalement débiteur (le débit ALIMENTE la charge, un crédit — ex: avoir
 * fournisseur — la RÉDUIT). Inverse pour un compte de produit (classe 7),
 * normalement créditeur.
 */
export function signedIncomeAmount(
  line: LedgerLineForIncome,
): { type: "Produit" | "Charge"; amount: number } | null {
  if (line.classe === "6")
    return { type: "Charge", amount: line.debit - line.credit };
  if (line.classe === "7")
    return { type: "Produit", amount: line.credit - line.debit };
  return null;
}
