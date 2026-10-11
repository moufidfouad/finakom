/**
 * Moteur de calcul CNPS + IR sur salaires — fonction pure. Formules vérifiées
 * contre le modèle source (TDB FISCALITÉ PME OHADA, onglets CNPS & CHARGES
 * SOC. et IR SUR SALAIRES).
 *
 * Point corrigé par rapport au modèle source : ses deux onglets utilisent
 * des masses salariales mensuelles DIFFÉRENTES pour le même mois (CNPS suit
 * une masse salariale croissante réaliste, IR affiche une valeur constante
 * toute l'année) — une incohérence interne du classeur, pas une intention.
 * Ce moteur calcule les deux à partir d'UNE SEULE masse salariale mensuelle
 * partagée (cohérent avec MonthlyPayrollTax.grossPayroll), qui est la seule
 * masse salariale réelle d'une entreprise à un instant donné.
 *
 * L'IR est calculé par ANNUALISATION (masse mensuelle × 12, barème
 * progressif appliqué sur l'année, résultat divisé par 12) — jamais un
 * barème appliqué directement au montant mensuel : les tranches du CGI sont
 * définies sur un revenu annuel, l'appliquer au mois donnerait un IR bien
 * trop faible pour la plupart des salaires.
 */
export interface PayrollTaxInput {
  grossPayroll: number;
}

export interface PayrollTaxComputed extends PayrollTaxInput {
  // CNPS
  employerContribution: number;
  employeeContribution: number;
  totalSocialContributions: number;
  vocationalTraining: number; // FAC
  totalToPay: number; // CNPS + FAC
  netSalaryPayable: number; // brut - part salariale (informatif)
  // IR
  annualizedPayroll: number;
  incomeTaxAllowance: number;
  netTaxableIncome: number;
  annualIncomeTax: number;
  monthlyIncomeTax: number;
}

interface IncomeTaxBrackets {
  allowanceRate: number;
  bracket1Threshold: number;
  bracket1Rate: number;
  bracket2Threshold: number;
  bracket2Rate: number;
  bracket3Threshold: number;
  bracket3Rate: number;
  bracket4Rate: number; // au-delà du seuil 3, pas de plafond
}

export function computeAnnualIncomeTax(
  netTaxableIncome: number,
  brackets: IncomeTaxBrackets,
): number {
  const t1 =
    Math.min(Math.max(0, netTaxableIncome), brackets.bracket1Threshold) *
    brackets.bracket1Rate;
  const t2 =
    Math.max(
      0,
      Math.min(netTaxableIncome, brackets.bracket2Threshold) -
        brackets.bracket1Threshold,
    ) * brackets.bracket2Rate;
  const t3 =
    Math.max(
      0,
      Math.min(netTaxableIncome, brackets.bracket3Threshold) -
        brackets.bracket2Threshold,
    ) * brackets.bracket3Rate;
  const t4 =
    Math.max(0, netTaxableIncome - brackets.bracket3Threshold) *
    brackets.bracket4Rate;
  return t1 + t2 + t3 + t4;
}

export function computePayrollTax(
  input: PayrollTaxInput,
  employerRate: number,
  employeeRate: number,
  vocationalTrainingRate: number,
  brackets: IncomeTaxBrackets,
): PayrollTaxComputed {
  const employerContribution = input.grossPayroll * employerRate;
  const employeeContribution = input.grossPayroll * employeeRate;
  const totalSocialContributions = employerContribution + employeeContribution;
  const vocationalTraining = input.grossPayroll * vocationalTrainingRate;
  const totalToPay = totalSocialContributions + vocationalTraining;
  const netSalaryPayable = input.grossPayroll - employeeContribution;

  const annualizedPayroll = input.grossPayroll * 12;
  const incomeTaxAllowance = annualizedPayroll * brackets.allowanceRate;
  const netTaxableIncome = annualizedPayroll - incomeTaxAllowance;
  const annualIncomeTax = computeAnnualIncomeTax(netTaxableIncome, brackets);
  const monthlyIncomeTax = annualIncomeTax / 12;

  return {
    ...input,
    employerContribution,
    employeeContribution,
    totalSocialContributions,
    vocationalTraining,
    totalToPay,
    netSalaryPayable,
    annualizedPayroll,
    incomeTaxAllowance,
    netTaxableIncome,
    annualIncomeTax,
    monthlyIncomeTax,
  };
}
