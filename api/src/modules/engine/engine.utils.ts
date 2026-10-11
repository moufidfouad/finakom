import {
  EnrichedBalanceLine,
  PosteDefinition,
  RawBalanceLine,
} from "./engine.types";

export function enrichLines(lines: RawBalanceLine[]): EnrichedBalanceLine[] {
  return lines.map((l) => {
    const account = (l.accountNumber ?? "").trim();
    return {
      ...l,
      classe: account.charAt(0),
      soldeNetN: Number(l.debitN || 0) - Number(l.creditN || 0),
      soldeNetN1: Number(l.debitN1 || 0) - Number(l.creditN1 || 0),
    };
  });
}

export function sumByPrefixes(
  lines: EnrichedBalanceLine[],
  prefixes: string[],
  field: "soldeNetN" | "soldeNetN1",
): number {
  return lines.reduce((total, line) => {
    const matches = prefixes.some((p) => line.accountNumber.startsWith(p));
    return matches ? total + line[field] : total;
  }, 0);
}

export function computePoste(
  lines: EnrichedBalanceLine[],
  poste: PosteDefinition,
): { n: number; n1: number } {
  const sign = poste.sign ?? 1;
  return {
    n: sign * sumByPrefixes(lines, poste.prefixes, "soldeNetN"),
    n1: sign * sumByPrefixes(lines, poste.prefixes, "soldeNetN1"),
  };
}

export function computePostes(
  lines: EnrichedBalanceLine[],
  postes: PosteDefinition[],
): Record<string, { n: number; n1: number }> {
  const result: Record<string, { n: number; n1: number }> = {};
  for (const poste of postes) {
    result[poste.ref] = computePoste(lines, poste);
  }
  return result;
}

export function variationPct(n: number, n1: number): number | null {
  if (n1 === 0) return null;
  return (n - n1) / Math.abs(n1);
}

export function sumPositive(
  lines: EnrichedBalanceLine[],
  classes: string[],
): number {
  return lines.reduce((total, l) => {
    if (classes.includes(l.classe) && l.soldeNetN > 0)
      return total + l.soldeNetN;
    return total;
  }, 0);
}

export function sumNegativeAbs(
  lines: EnrichedBalanceLine[],
  classes: string[],
): number {
  return lines.reduce((total, l) => {
    if (classes.includes(l.classe) && l.soldeNetN < 0)
      return total - l.soldeNetN;
    return total;
  }, 0);
}
