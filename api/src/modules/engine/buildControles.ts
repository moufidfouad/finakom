import { EnrichedBalanceLine } from "./engine.types";
import { sumByPrefixes } from "./engine.utils";

const TOLERANCE = 1;

export interface ControlesResult {
  totalDebit: { n: number; n1: number };
  totalCredit: { n: number; n1: number };
  ecartDebitCredit: { n: number; n1: number; equilibre: boolean };
  totalActif: { n: number; n1: number };
  totalPassif: { n: number; n1: number };
  ecartActifPassif: { n: number; n1: number; equilibre: boolean };
  comptesASurveiller: {
    label: string;
    compte: string;
    soldeN: number;
    vigilance: string;
  }[];
}

export function buildControles(lines: EnrichedBalanceLine[]): ControlesResult {
  const totalDebitN = lines.reduce((t, l) => t + Number(l.debitN || 0), 0);
  const totalDebitN1 = lines.reduce((t, l) => t + Number(l.debitN1 || 0), 0);
  const totalCreditN = lines.reduce((t, l) => t + Number(l.creditN || 0), 0);
  const totalCreditN1 = lines.reduce((t, l) => t + Number(l.creditN1 || 0), 0);

  const ecartDebitCreditN = totalDebitN - totalCreditN;
  const ecartDebitCreditN1 = totalDebitN1 - totalCreditN1;

  const totalActifN =
    sumPositiveByClasses(lines, ["2", "3", "5"], "soldeNetN") +
    sumPositiveByClasses(lines, ["4"], "soldeNetN");
  const totalActifN1 =
    sumPositiveByClasses(lines, ["2", "3", "5"], "soldeNetN1") +
    sumPositiveByClasses(lines, ["4"], "soldeNetN1");

  const totalPassifN = sumNegativeAbsByClasses(
    lines,
    ["1", "4", "5"],
    "soldeNetN",
  );
  const totalPassifN1 = sumNegativeAbsByClasses(
    lines,
    ["1", "4", "5"],
    "soldeNetN1",
  );

  const ecartActifPassifN = totalActifN - totalPassifN;
  const ecartActifPassifN1 = totalActifN1 - totalPassifN1;

  const comptesASurveiller = [
    {
      label: "Comptes d'attente",
      compte: "47",
      prefixes: ["47"],
      vigilance: "Doit être soldé avant clôture",
    },
    {
      label: "Virements internes",
      compte: "58",
      prefixes: ["58"],
      vigilance: "Doit être soldé (= 0)",
    },
    {
      label: "État, TVA due/crédit",
      compte: "44",
      prefixes: ["44"],
      vigilance: "Cohérence collectée/déductible",
    },
    {
      label: "Personnel",
      compte: "42",
      prefixes: ["42"],
      vigilance: "Soldes inhabituels à justifier",
    },
    {
      label: "Organismes sociaux (CNPS)",
      compte: "43",
      prefixes: ["43"],
      vigilance: "Cotisations dues à régler",
    },
    {
      label: "Comptes courants associés",
      compte: "46",
      prefixes: ["46"],
      vigilance: "Risque fiscal / déductibilité",
    },
  ].map((item) => ({
    label: item.label,
    compte: item.compte,
    soldeN: sumByPrefixes(lines, item.prefixes, "soldeNetN"),
    vigilance: item.vigilance,
  }));

  return {
    totalDebit: { n: totalDebitN, n1: totalDebitN1 },
    totalCredit: { n: totalCreditN, n1: totalCreditN1 },
    ecartDebitCredit: {
      n: ecartDebitCreditN,
      n1: ecartDebitCreditN1,
      equilibre: Math.abs(ecartDebitCreditN) < TOLERANCE,
    },
    totalActif: { n: totalActifN, n1: totalActifN1 },
    totalPassif: { n: totalPassifN, n1: totalPassifN1 },
    ecartActifPassif: {
      n: ecartActifPassifN,
      n1: ecartActifPassifN1,
      equilibre: Math.abs(ecartActifPassifN) < TOLERANCE,
    },
    comptesASurveiller,
  };
}

function sumPositiveByClasses(
  lines: EnrichedBalanceLine[],
  classes: string[],
  field: "soldeNetN" | "soldeNetN1",
): number {
  return lines.reduce(
    (total, l) =>
      classes.includes(l.classe) && l[field] > 0 ? total + l[field] : total,
    0,
  );
}

function sumNegativeAbsByClasses(
  lines: EnrichedBalanceLine[],
  classes: string[],
  field: "soldeNetN" | "soldeNetN1",
): number {
  return lines.reduce(
    (total, l) =>
      classes.includes(l.classe) && l[field] < 0 ? total - l[field] : total,
    0,
  );
}
