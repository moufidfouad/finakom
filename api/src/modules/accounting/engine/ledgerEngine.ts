/**
 * Moteur pur de comptabilité générale — validation de l'équilibre d'une écriture
 * (partie double) et calcul d'une balance à partir de lignes d'écritures déjà
 * postées. Aucun accès base de données ici (voir ledger.service.ts) : ces
 * fonctions sont le cœur critique de tout le module — leur correction doit
 * pouvoir être vérifiée en isolation, indépendamment de Prisma.
 */

export interface EntryLineInput {
  accountNumber: string;
  debit: number;
  credit: number;
}

export interface BalanceCheckResult {
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  difference: number;
}

/**
 * Vérifie qu'une écriture respecte la partie double : total débit = total
 * crédit. Une ligne ne doit jamais porter à la fois un débit ET un crédit non
 * nuls (règle SYSCOHADA de base — une ligne mouvemente un compte dans un seul
 * sens), et chaque ligne doit avoir un montant non nul dans au moins un des deux sens.
 */
export function checkEntryBalance(lines: EntryLineInput[]): BalanceCheckResult {
  const totalDebit = round2(lines.reduce((s, l) => s + l.debit, 0));
  const totalCredit = round2(lines.reduce((s, l) => s + l.credit, 0));
  const difference = round2(totalDebit - totalCredit);
  return { totalDebit, totalCredit, isBalanced: difference === 0, difference };
}

export function validateLineShape(line: EntryLineInput): string | null {
  if (line.debit > 0 && line.credit > 0) {
    return `La ligne sur le compte ${line.accountNumber} porte à la fois un débit et un crédit — une ligne d'écriture ne peut mouvementer un compte que dans un seul sens.`;
  }
  if (line.debit === 0 && line.credit === 0) {
    return `La ligne sur le compte ${line.accountNumber} n'a aucun montant (débit et crédit tous deux nuls).`;
  }
  if (line.debit < 0 || line.credit < 0) {
    return `La ligne sur le compte ${line.accountNumber} porte un montant négatif — utilisez le sens opposé plutôt qu'un montant négatif.`;
  }
  return null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface PostedLine {
  accountNumber: string;
  debit: number;
  credit: number;
  date: Date;
}

export interface TrialBalanceLine {
  accountNumber: string;
  label?: string;
  debitN: number;
  creditN: number;
  debitN1: number;
  creditN1: number;
}

/**
 * Agrège des lignes d'écritures postées en une balance par compte — même forme
 * (RawBalanceLine) que celle consommée par le moteur d'analyse financière
 * (buildFullReport), pour brancher directement la comptabilité générale sur le
 * module Analyse financière déjà existant sans y toucher.
 */
export function computeTrialBalance(
  lines: PostedLine[],
  periodN: { start: Date; end: Date },
  periodN1?: { start: Date; end: Date },
): TrialBalanceLine[] {
  const byAccount = new Map<string, TrialBalanceLine>();

  const isInPeriod = (date: Date, period: { start: Date; end: Date }) =>
    date >= period.start && date <= period.end;

  for (const line of lines) {
    if (!byAccount.has(line.accountNumber)) {
      byAccount.set(line.accountNumber, {
        accountNumber: line.accountNumber,
        debitN: 0,
        creditN: 0,
        debitN1: 0,
        creditN1: 0,
      });
    }
    const acc = byAccount.get(line.accountNumber)!;

    if (isInPeriod(line.date, periodN)) {
      acc.debitN = round2(acc.debitN + line.debit);
      acc.creditN = round2(acc.creditN + line.credit);
    } else if (periodN1 && isInPeriod(line.date, periodN1)) {
      acc.debitN1 = round2(acc.debitN1 + line.debit);
      acc.creditN1 = round2(acc.creditN1 + line.credit);
    }
  }

  return [...byAccount.values()].sort((a, b) =>
    a.accountNumber.localeCompare(b.accountNumber),
  );
}

/** Solde net d'un compte pour la période N (débit - crédit) — utile pour le grand livre. */
export function computeAccountBalance(
  lines: { debit: number; credit: number }[],
): number {
  return round2(lines.reduce((s, l) => s + l.debit - l.credit, 0));
}
