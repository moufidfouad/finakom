/**
 * Moteur de calcul TVA — fonction pure, aucune dépendance à Prisma, testable
 * isolément. Formules vérifiées contre le modèle source (TDB FISCALITÉ PME
 * OHADA, onglet TVA MENSUELLE) : CA HT = CA TTC / (1+taux), TVA = HT × taux.
 * Le crédit reporté du mois précédent réduit la TVA nette du mois courant ;
 * s'il l'excède, le solde devient le nouveau crédit à reporter — jamais un
 * montant à verser négatif.
 */
export interface VatMonthInput {
  salesIncTax: number; // CA TTC
  purchasesIncTax: number; // achats TTC déductibles
}

export interface VatMonthComputed extends VatMonthInput {
  salesExTax: number; // CA HT
  vatCollected: number;
  purchasesExTax: number; // base HT achats
  vatDeductible: number;
  netBeforeCredit: number; // collectée - déductible, avant crédit reporté
  creditCarriedForward: number; // crédit du mois précédent, appliqué ce mois-ci
  vatToPay: number; // jamais négatif
  newCredit: number; // reporté au mois suivant
}

export function computeVatMonth(
  input: VatMonthInput,
  vatRate: number,
  creditCarriedForward: number,
): VatMonthComputed {
  const salesExTax = input.salesIncTax / (1 + vatRate);
  const vatCollected = salesExTax * vatRate;
  const purchasesExTax = input.purchasesIncTax / (1 + vatRate);
  const vatDeductible = purchasesExTax * vatRate;
  const netBeforeCredit = vatCollected - vatDeductible;
  const netAfterCredit = netBeforeCredit - creditCarriedForward;

  return {
    ...input,
    salesExTax,
    vatCollected,
    purchasesExTax,
    vatDeductible,
    netBeforeCredit,
    creditCarriedForward,
    vatToPay: Math.max(0, netAfterCredit),
    newCredit: netAfterCredit < 0 ? -netAfterCredit : 0,
  };
}

/** Calcule une année complète en enchaînant le crédit reporté mois par
 * mois — jamais calculable colonne par colonne indépendamment, chaque mois
 * dépend du solde du précédent. `months` doit être trié par période
 * croissante et ne couvrir qu'une seule année fiscale. */
export function computeVatYear(
  months: VatMonthInput[],
  vatRate: number,
  openingCredit = 0,
): VatMonthComputed[] {
  let carriedCredit = openingCredit;
  return months.map((month) => {
    const computed = computeVatMonth(month, vatRate, carriedCredit);
    carriedCredit = computed.newCredit;
    return computed;
  });
}
