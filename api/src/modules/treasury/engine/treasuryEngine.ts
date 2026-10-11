/**
 * Moteur de calcul trésorerie — reproduit les formules du classeur "TDB Trésorerie
 * & Cash Flow" : solde cumulé, solde par support (Caisse vs Banque+Mobile Money),
 * signal d'alerte (seuils), et comparaison prévisionnel vs réel.
 */

export interface TreasuryMovement {
  date: Date;
  type: "Encaissement" | "Décaissement";
  amount: number;
  support: string; // Caisse | Banque | Orange Money | MTN MoMo | Wave
  category: string;
}

const BANK_LIKE_SUPPORTS = new Set([
  "Banque",
  "Orange Money",
  "MTN MoMo",
  "Wave",
]);

export interface CashPosition {
  totalBalance: number;
  bankBalance: number; // Banque + Mobile Money (formule I3 du journal)
  cashBalance: number; // Caisse (formule K3 du journal)
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
}

export function computeCashPosition(
  movements: TreasuryMovement[],
  openingCashBalance: number,
  openingBankBalance: number,
): CashPosition {
  let bankBalance = openingBankBalance;
  let cashBalance = openingCashBalance;
  let totalInflow = 0;
  let totalOutflow = 0;

  for (const m of movements) {
    const signedAmount = m.type === "Encaissement" ? m.amount : -m.amount;
    if (m.support === "Caisse") cashBalance += signedAmount;
    else if (BANK_LIKE_SUPPORTS.has(m.support)) bankBalance += signedAmount;

    if (m.type === "Encaissement") totalInflow += m.amount;
    else totalOutflow += m.amount;
  }

  return {
    totalBalance: bankBalance + cashBalance,
    bankBalance,
    cashBalance,
    totalInflow,
    totalOutflow,
    netFlow: totalInflow - totalOutflow,
  };
}

/** Ajoute le solde cumulé (colonne I du journal) à chaque écriture, dans l'ordre chronologique. */
export function withRunningBalance<
  T extends {
    date: Date;
    type: "Encaissement" | "Décaissement";
    amount: number;
  },
>(movements: T[], openingBalance: number): (T & { runningBalance: number })[] {
  const sorted = [...movements].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  let balance = openingBalance;
  return sorted.map((m) => {
    balance += m.type === "Encaissement" ? m.amount : -m.amount;
    return { ...m, runningBalance: balance };
  });
}

export type TreasurySignal = "CRITIQUE" | "ALERTE" | "OK";

export function computeSignal(
  balance: number,
  alertThreshold: number,
  criticalThreshold: number,
): TreasurySignal {
  if (balance < criticalThreshold) return "CRITIQUE";
  if (balance < alertThreshold) return "ALERTE";
  return "OK";
}

export interface MonthlyForecastLine {
  month: number; // 1-12
  rubric: string;
  type: "Encaissement" | "Décaissement";
  amount: number;
}

export interface MonthlyBalance {
  month: number;
  inflow: number;
  outflow: number;
  netFlow: number;
  openingBalance: number;
  closingBalance: number;
  signal: TreasurySignal;
}

/** Reproduit les lignes 28/30/31/33 du budget prévisionnel : flux net, solde cumulé mois par mois, signal. */
export function buildMonthlySchedule(
  lines: {
    month: number;
    type: "Encaissement" | "Décaissement";
    amount: number;
  }[],
  openingBalance: number,
  alertThreshold: number,
  criticalThreshold: number,
): MonthlyBalance[] {
  const result: MonthlyBalance[] = [];
  let runningOpening = openingBalance;

  for (let month = 1; month <= 12; month++) {
    const monthLines = lines.filter((l) => l.month === month);
    const inflow = monthLines
      .filter((l) => l.type === "Encaissement")
      .reduce((s, l) => s + l.amount, 0);
    const outflow = monthLines
      .filter((l) => l.type === "Décaissement")
      .reduce((s, l) => s + l.amount, 0);
    const netFlow = inflow - outflow;
    const closingBalance = runningOpening + netFlow;

    result.push({
      month,
      inflow,
      outflow,
      netFlow,
      openingBalance: runningOpening,
      closingBalance,
      signal: computeSignal(closingBalance, alertThreshold, criticalThreshold),
    });

    runningOpening = closingBalance;
  }

  return result;
}
