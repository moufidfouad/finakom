/**
 * Moteur pur de synthèse TVA — agrège les lignes déjà postées sur les comptes
 * TVA collectée et TVA déductible (contre-passées automatiquement à chaque
 * vente et chaque achat, voir postingEngine.ts) en une synthèse prête à
 * reporter sur une déclaration : TVA collectée − TVA déductible = TVA à payer
 * (ou crédit de TVA si négatif). Aucun accès base de données ici (voir
 * vatSummary.service.ts).
 */

export interface AccountLineForVat {
  debit: number;
  credit: number;
}

export interface VatSummaryResult {
  totalCollected: number;
  totalDeductible: number;
  netVat: number; // positif = TVA à payer, négatif = crédit de TVA reportable
  isCredit: boolean;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * `collectedLines` : lignes du compte TVA collectée (normalement à solde
 * créditeur — créditée à chaque vente, voir buildSaleEntryLines).
 * `deductibleLines` : lignes du compte TVA déductible (normalement à solde
 * débiteur — débitée à chaque achat, voir buildPurchaseEntryLines).
 */
export function computeVatSummary(
  collectedLines: AccountLineForVat[],
  deductibleLines: AccountLineForVat[],
): VatSummaryResult {
  const totalCollected = round2(
    collectedLines.reduce((s, l) => s + l.credit - l.debit, 0),
  );
  const totalDeductible = round2(
    deductibleLines.reduce((s, l) => s + l.debit - l.credit, 0),
  );
  const netVat = round2(totalCollected - totalDeductible);

  return { totalCollected, totalDeductible, netVat, isCredit: netVat < 0 };
}
