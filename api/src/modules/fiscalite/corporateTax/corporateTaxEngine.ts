/**
 * Moteur de calcul IS — fonction pure. Formules vérifiées contre le modèle
 * source (TDB FISCALITÉ PME OHADA, onglet IMPOT SUR SOCIETES).
 *
 * Point d'attention documenté : le modèle source étiquette le déficit
 * reporté N-1 "(+)" dans son libellé, mais fiscalement un déficit reporté
 * RÉDUIT le résultat imposable (c'est tout le sens d'un report de déficit —
 * voir GUIDE FISCAL OHADA du même classeur : "Les déficits sont reportables
 * sur 4 exercices"). La valeur de référence du modèle est 0, donc le signe
 * ne peut pas être vérifié empiriquement contre les chiffres fournis — cette
 * implémentation suit la règle fiscale correcte (soustraction) plutôt que le
 * "+" du libellé, qui est vraisemblablement une convention d'affichage du
 * classeur d'origine plutôt qu'une inversion de signe voulue.
 */
export interface CorporateTaxInput {
  accountingResult: number;
  fiscalReintegrations: number;
  fiscalDeductions: number;
  priorYearLoss: number;
  annualRevenue: number;
  priorYearTax: number;
  taxCredits: number;
  installmentsPaidQ1: number;
  installmentsPaidQ2: number;
  installmentsPaidQ3: number;
  installmentsPaidQ4: number;
}

export interface CorporateTaxComputed extends CorporateTaxInput {
  fiscalResult: number;
  calculatedTax: number; // 30% × résultat fiscal (jamais négatif)
  minimumTax: number; // BAIOP = 1% × CA
  taxDue: number; // MAX(calculatedTax, minimumTax)
  netTaxPayable: number; // taxDue - crédits d'impôt
  quarterlyInstallmentAmount: number; // 25% × IS N-1, identique chaque trimestre
  totalInstallmentsDue: number;
  totalInstallmentsPaid: number;
  yearEndBalance: number; // négatif = crédit / trop-versé, positif = solde restant dû
}

export function computeCorporateTax(
  input: CorporateTaxInput,
  corporateTaxRate: number,
  corporateTaxMinRate: number,
  corporateTaxInstallmentRate: number,
): CorporateTaxComputed {
  const fiscalResult =
    input.accountingResult +
    input.fiscalReintegrations -
    input.fiscalDeductions -
    input.priorYearLoss;
  const calculatedTax = Math.max(0, fiscalResult) * corporateTaxRate;
  const minimumTax = input.annualRevenue * corporateTaxMinRate;
  const taxDue = Math.max(calculatedTax, minimumTax);
  const netTaxPayable = Math.max(0, taxDue - input.taxCredits);

  const quarterlyInstallmentAmount =
    input.priorYearTax * corporateTaxInstallmentRate;
  const totalInstallmentsDue = quarterlyInstallmentAmount * 4;
  const totalInstallmentsPaid =
    input.installmentsPaidQ1 +
    input.installmentsPaidQ2 +
    input.installmentsPaidQ3 +
    input.installmentsPaidQ4;
  const yearEndBalance = netTaxPayable - totalInstallmentsDue;

  return {
    ...input,
    fiscalResult,
    calculatedTax,
    minimumTax,
    taxDue,
    netTaxPayable,
    quarterlyInstallmentAmount,
    totalInstallmentsDue,
    totalInstallmentsPaid,
    yearEndBalance,
  };
}
