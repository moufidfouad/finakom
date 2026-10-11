/**
 * Moteur pur de clôture d'exercice — calcule l'écriture qui solde tous les
 * comptes de charges (classe 6) et de produits (classe 7) vers le compte de
 * résultat (130 bénéfice ou 129 perte), conformément au mécanisme standard
 * SYSCOHADA de détermination du résultat net. Aucun accès base de données ici
 * (voir fiscalYearClosing.service.ts).
 *
 * Les comptes de bilan (classes 1 à 5) ne sont volontairement PAS soldés : ils
 * portent leur solde d'un exercice à l'autre sans écriture de réouverture
 * séparée — seuls les comptes de gestion (6/7) sont remis à zéro à chaque clôture.
 */

export interface AccountForClosing {
  accountNumber: string;
  classe: string; // premier chiffre du compte ("6", "7"...)
  debitN: number;
  creditN: number;
}

export interface ClosingLine {
  accountNumber: string;
  debit: number;
  credit: number;
}

export interface ClosingEntryResult {
  lines: ClosingLine[];
  totalCharges: number;
  totalProduits: number;
  netResult: number; // positif = bénéfice, négatif = perte
}

const RESULT_ACCOUNT_PROFIT = "130"; // Résultat net de l'exercice (bénéfice)
const RESULT_ACCOUNT_LOSS = "129"; // Résultat net de l'exercice (perte)

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calcule les lignes de l'écriture de clôture à partir de la balance de
 * l'exercice. Chaque compte de charge (solde normalement débiteur) est soldé
 * par un crédit ; chaque compte de produit (solde normalement créditeur) est
 * soldé par un débit ; l'écart va au compte de résultat approprié.
 */
export function computeClosingEntry(
  accounts: AccountForClosing[],
): ClosingEntryResult {
  const lines: ClosingLine[] = [];
  let totalCharges = 0;
  let totalProduits = 0;

  for (const acc of accounts) {
    const balance = round2(acc.debitN - acc.creditN);
    if (balance === 0) continue;

    if (acc.classe === "6") {
      // Un compte de charge a normalement un solde débiteur (>0) — le solder
      // revient à le créditer de ce montant. Un solde négatif (rare, ex: avoir
      // fournisseur imputé sur charge) se solderait par un débit — géré
      // symétriquement via le signe.
      if (balance > 0)
        lines.push({
          accountNumber: acc.accountNumber,
          debit: 0,
          credit: balance,
        });
      else
        lines.push({
          accountNumber: acc.accountNumber,
          debit: -balance,
          credit: 0,
        });
      totalCharges = round2(totalCharges + balance);
    } else if (acc.classe === "7") {
      // Un compte de produit a normalement un solde créditeur (balance < 0
      // puisque balance = débit - crédit) — le solder revient à le débiter.
      if (balance < 0)
        lines.push({
          accountNumber: acc.accountNumber,
          debit: -balance,
          credit: 0,
        });
      else
        lines.push({
          accountNumber: acc.accountNumber,
          debit: 0,
          credit: balance,
        });
      totalProduits = round2(totalProduits - balance);
    }
  }

  const netResult = round2(totalProduits - totalCharges);
  if (netResult > 0) {
    lines.push({
      accountNumber: RESULT_ACCOUNT_PROFIT,
      debit: 0,
      credit: netResult,
    });
  } else if (netResult < 0) {
    lines.push({
      accountNumber: RESULT_ACCOUNT_LOSS,
      debit: -netResult,
      credit: 0,
    });
  }

  return { lines, totalCharges, totalProduits, netResult };
}
