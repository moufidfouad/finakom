/**
 * Moteur de calcul du business plan — reproduit fidèlement les formules du
 * classeur source (onglets "Investissement de départ", "Compte de résultat
 * prévisionnel - sur 3 ans", "Plan de trésorerie", "Bilan et indicateurs
 * financiers"). Note de fidélité : le classeur source comporte une ligne
 * "Intérêts d'emprunt" dupliquée (une fois dans les charges financières, une
 * seconde fois juste avant le résultat net) — vraisemblablement une coquille
 * de copier-coller du modèle original. On reproduit la même mécanique de calcul
 * (une déduction manuelle supplémentaire entre "résultat avant impôts" et
 * "résultat net") mais on la nomme correctement "Impôt sur les sociétés", son
 * rôle réel dans la cascade.
 */

// ---------- Investissement & financement ----------

export interface InvestmentFundingSummary {
  totalInvestment: number;
  totalFunding: number;
  balance: number; // Total ressources - Total investissement
  isFullyFunded: boolean;
}

export function computeInvestmentFundingSummary(
  investments: number[],
  fundings: number[],
): InvestmentFundingSummary {
  const totalInvestment = investments.reduce((s, v) => s + v, 0);
  const totalFunding = fundings.reduce((s, v) => s + v, 0);
  const balance = totalFunding - totalInvestment;
  return {
    totalInvestment,
    totalFunding,
    balance,
    isFullyFunded: balance >= 0,
  };
}

// ---------- Compte de résultat prévisionnel ----------

export type PLSection =
  | "ChiffreAffaires"
  | "ChargesVariables"
  | "ChargesFixes"
  | "ChargesPersonnel"
  | "ImpotsTaxes"
  | "ChargesFinancieres"
  | "ImpotSocietes";

export interface PLLineInput {
  section: PLSection;
  amount: number;
}

export interface PLYearResult {
  chiffreAffaires: number;
  chargesVariables: number;
  margeBrute: number;
  chargesFixes: number;
  chargesPersonnel: number;
  excedentBrutExploitation: number;
  impotsTaxes: number;
  chargesFinancieres: number;
  resultatAvantImpots: number;
  impotSocietes: number;
  resultatNet: number;
  tauxMargeBrute: number | null;
  margeNette: number | null;
  seuilDeRentabilite: number | null;
}

function sumSection(lines: PLLineInput[], section: PLSection): number {
  return lines
    .filter((l) => l.section === section)
    .reduce((s, l) => s + l.amount, 0);
}

/** Reproduit la cascade E11→E28→E61→E73→E75 du compte de résultat. */
export function computePLYear(lines: PLLineInput[]): PLYearResult {
  const chiffreAffaires = sumSection(lines, "ChiffreAffaires");
  const chargesVariables = sumSection(lines, "ChargesVariables");
  const margeBrute = chiffreAffaires - chargesVariables;
  const chargesFixes = sumSection(lines, "ChargesFixes");
  const chargesPersonnel = sumSection(lines, "ChargesPersonnel");
  const excedentBrutExploitation = margeBrute - chargesFixes - chargesPersonnel;
  const impotsTaxes = sumSection(lines, "ImpotsTaxes");
  const chargesFinancieres = sumSection(lines, "ChargesFinancieres");
  const resultatAvantImpots =
    margeBrute -
    (chargesFixes + chargesPersonnel + impotsTaxes + chargesFinancieres);
  const impotSocietes = sumSection(lines, "ImpotSocietes");
  const resultatNet = resultatAvantImpots - impotSocietes;

  // Seuil de rentabilité = Charges fixes / (1 - (Charges variables / CA)) — formule M12 du classeur
  const seuilDeRentabilite =
    chiffreAffaires !== 0
      ? chargesFixes / (1 - chargesVariables / chiffreAffaires)
      : null;

  return {
    chiffreAffaires,
    chargesVariables,
    margeBrute,
    chargesFixes,
    chargesPersonnel,
    excedentBrutExploitation,
    impotsTaxes,
    chargesFinancieres,
    resultatAvantImpots,
    impotSocietes,
    resultatNet,
    tauxMargeBrute: chiffreAffaires !== 0 ? margeBrute / chiffreAffaires : null,
    margeNette: chiffreAffaires !== 0 ? resultatNet / chiffreAffaires : null,
    seuilDeRentabilite,
  };
}

export function computePLProjection(
  linesByYear: Map<number, PLLineInput[]>,
): Map<number, PLYearResult> {
  const result = new Map<number, PLYearResult>();
  for (const [year, lines] of linesByYear) {
    result.set(year, computePLYear(lines));
  }
  return result;
}

/** Reproduit le message L13 : rentabilité jugée sur la dernière année de l'horizon. */
export function computeProfitabilityMessage(
  lastYearResult: PLYearResult | undefined,
  lastYearLabel: string,
): string {
  if (!lastYearResult) return "";
  return lastYearResult.resultatNet > 0
    ? `✅ Entreprise rentable à partir de ${lastYearLabel}`
    : "❌ Entreprise déficitaire sur la période, plan à renforcer";
}

// ---------- Plan de trésorerie mensuel ----------
// Réutilise le moteur mensuel du module Trésorerie (même mathématique : flux net
// mensuel, solde cumulé) — une seule implémentation, testée une seule fois.
export { buildMonthlySchedule as buildCashflowSchedule } from "@/modules/treasury/engine/treasuryEngine";

// ---------- Bilan prévisionnel & indicateurs ----------

export interface BalanceLineInput {
  side: "Actif" | "Passif";
  category: string;
  amount: number;
}

export interface BalanceYearResult {
  totalActif: number;
  totalPassif: number;
  bfr: number;
  tresorerieNette: number;
  tauxEndettement: number | null;
  autonomieFinanciere: number | null;
  isEquilibre: boolean;
}

const CURRENT_ASSET_CATEGORIES = ["Stocks", "Créances clients", "Créance TVA"];
const CURRENT_LIABILITY_CATEGORIES = [
  "Dettes fournisseurs",
  "Dettes fiscales et sociales",
];
const DEBT_CATEGORIES = [
  "Emprunts",
  "Dettes fournisseurs",
  "Dettes fiscales et sociales",
];
const EQUITY_CATEGORIES = ["Apport personnel", "Résultat net", "Réserves"];

/**
 * Assemble le bilan d'une année. `resultatNet` (compte de résultat) et
 * `tresorerieFinPeriode` (plan de trésorerie, solde cumulé de fin d'année)
 * viennent des DEUX AUTRES moteurs, jamais ressaisis manuellement — cohérent
 * avec le principe de source unique de vérité déjà appliqué partout ailleurs.
 */
export function computeBalanceYear(
  lines: BalanceLineInput[],
  resultatNet: number,
  tresorerieFinPeriode: number,
): BalanceYearResult {
  const actifLines = lines.filter((l) => l.side === "Actif");
  const passifLinesWithoutResult = lines.filter((l) => l.side === "Passif");

  const totalActifSaisi = actifLines.reduce((s, l) => s + l.amount, 0);
  const totalActif = totalActifSaisi + tresorerieFinPeriode;

  const totalPassif =
    passifLinesWithoutResult.reduce((s, l) => s + l.amount, 0) + resultatNet;

  const actifCirculant = actifLines
    .filter((l) => CURRENT_ASSET_CATEGORIES.includes(l.category))
    .reduce((s, l) => s + l.amount, 0);
  const passifCirculant = passifLinesWithoutResult
    .filter((l) => CURRENT_LIABILITY_CATEGORIES.includes(l.category))
    .reduce((s, l) => s + l.amount, 0);
  const bfr = actifCirculant - passifCirculant;
  const tresorerieNette = tresorerieFinPeriode - bfr;

  const dettes = passifLinesWithoutResult
    .filter((l) => DEBT_CATEGORIES.includes(l.category))
    .reduce((s, l) => s + l.amount, 0);
  const fondsPropres =
    passifLinesWithoutResult
      .filter((l) => EQUITY_CATEGORIES.includes(l.category))
      .reduce((s, l) => s + l.amount, 0) + resultatNet;

  return {
    totalActif,
    totalPassif,
    bfr,
    tresorerieNette,
    tauxEndettement: totalPassif !== 0 ? dettes / totalPassif : null,
    autonomieFinanciere: totalPassif !== 0 ? fondsPropres / totalPassif : null,
    isEquilibre: Math.abs(totalActif - totalPassif) < 1,
  };
}

export interface FinancialHealthAppreciation {
  message: string;
  level: "bon" | "fragile" | "desequilibre";
}

/** Reproduit le message L12 du bilan : moyenne des 3 indicateurs sur l'horizon du plan. */
export function computeFinancialHealthAppreciation(
  yearResults: BalanceYearResult[],
): FinancialHealthAppreciation {
  if (yearResults.length === 0) return { message: "", level: "fragile" };

  const avg = (values: (number | null)[]) => {
    const valid = values.filter((v): v is number => v !== null);
    return valid.length > 0
      ? valid.reduce((s, v) => s + v, 0) / valid.length
      : 0;
  };

  const avgTresorerieNette = avg(yearResults.map((y) => y.tresorerieNette));
  const avgTauxEndettement = avg(yearResults.map((y) => y.tauxEndettement));
  const avgAutonomie = avg(yearResults.map((y) => y.autonomieFinanciere));

  if (
    avgTresorerieNette > 0 &&
    avgTauxEndettement < 0.8 &&
    avgAutonomie > 0.4
  ) {
    return {
      message:
        "✅ L'entreprise montre une progression stable : trésorerie moyenne positive, endettement maîtrisé et autonomie financière correcte",
      level: "bon",
    };
  }
  if (avgTresorerieNette < 0 || avgTauxEndettement > 1 || avgAutonomie < 0.3) {
    return {
      message:
        "⚠️ Le plan reste fragile sur la période : trésorerie moyenne basse ou endettement élevé",
      level: "fragile",
    };
  }
  return {
    message: "❌ Structure financière globalement déséquilibrée sur la période",
    level: "desequilibre",
  };
}
