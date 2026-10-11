import { EnrichedBalanceLine } from "./engine.types";
import { computePostes, variationPct } from "./engine.utils";
import {
  ACTIF_CIRCULANT,
  ACTIF_IMMOBILISE,
  CAPITAUX_PROPRES,
  DETTES_FINANCIERES,
  PASSIF_CIRCULANT,
  TRESORERIE_ACTIF,
  TRESORERIE_PASSIF,
} from "./posteDefinitions.bilan";

function sumN(
  dict: Record<string, { n: number; n1: number }>,
  refs: string[],
  key: "n" | "n1",
) {
  return refs.reduce((total, ref) => total + (dict[ref]?.[key] ?? 0), 0);
}

function withVariation(n: number, n1: number) {
  return { n, n1, variationPct: variationPct(n, n1) };
}

export interface BilanResult {
  actif: {
    postes: Record<
      string,
      { label: string; n: number; n1: number; variationPct: number | null }
    >;
    totalActifImmobilise: {
      n: number;
      n1: number;
      variationPct: number | null;
    };
    totalActifCirculant: { n: number; n1: number; variationPct: number | null };
    totalTresorerieActif: {
      n: number;
      n1: number;
      variationPct: number | null;
    };
    totalGeneralActif: { n: number; n1: number; variationPct: number | null };
  };
  passif: {
    postes: Record<
      string,
      { label: string; n: number; n1: number; variationPct: number | null }
    >;
    totalCapitauxPropres: {
      n: number;
      n1: number;
      variationPct: number | null;
    };
    totalDettesFinancieres: {
      n: number;
      n1: number;
      variationPct: number | null;
    };
    totalRessourcesStables: {
      n: number;
      n1: number;
      variationPct: number | null;
    };
    totalPassifCirculant: {
      n: number;
      n1: number;
      variationPct: number | null;
    };
    totalTresoreriePassif: {
      n: number;
      n1: number;
      variationPct: number | null;
    };
    totalGeneralPassif: { n: number; n1: number; variationPct: number | null };
  };
  equilibreFonctionnel: {
    fondsDeRoulement: { n: number; n1: number };
    besoinFondsDeRoulement: { n: number; n1: number };
    tresorerieNette: { n: number; n1: number };
    controle: { n: number; n1: number };
  };
}

export function buildBilan(lines: EnrichedBalanceLine[]): BilanResult {
  const allActifPostes = [
    ...ACTIF_IMMOBILISE,
    ...ACTIF_CIRCULANT,
    ...TRESORERIE_ACTIF,
  ];
  const allPassifPostes = [
    ...CAPITAUX_PROPRES,
    ...DETTES_FINANCIERES,
    ...PASSIF_CIRCULANT,
    ...TRESORERIE_PASSIF,
  ];

  const actifValues = computePostes(lines, allActifPostes);
  const passifValues = computePostes(lines, allPassifPostes);

  const actifPostes: BilanResult["actif"]["postes"] = {};
  for (const p of allActifPostes) {
    const v = actifValues[p.ref];
    actifPostes[p.ref] = { label: p.label, ...withVariation(v.n, v.n1) };
  }

  const passifPostes: BilanResult["passif"]["postes"] = {};
  for (const p of allPassifPostes) {
    const v = passifValues[p.ref];
    passifPostes[p.ref] = { label: p.label, ...withVariation(v.n, v.n1) };
  }

  const totalActifImmobiliseN = sumN(actifValues, ["AD", "AI", "AQ"], "n");
  const totalActifImmobiliseN1 = sumN(actifValues, ["AD", "AI", "AQ"], "n1");
  const totalActifCirculantN = sumN(actifValues, ["BA", "BB", "BG", "BH"], "n");
  const totalActifCirculantN1 = sumN(
    actifValues,
    ["BA", "BB", "BG", "BH"],
    "n1",
  );
  const totalTresorerieActifN = sumN(actifValues, ["BR", "BS", "BT"], "n");
  const totalTresorerieActifN1 = sumN(actifValues, ["BR", "BS", "BT"], "n1");
  const totalGeneralActifN =
    totalActifImmobiliseN + totalActifCirculantN + totalTresorerieActifN;
  const totalGeneralActifN1 =
    totalActifImmobiliseN1 + totalActifCirculantN1 + totalTresorerieActifN1;

  const totalCapitauxPropresN = sumN(
    passifValues,
    ["CA", "CD", "CH", "CJ", "CK"],
    "n",
  );
  const totalCapitauxPropresN1 = sumN(
    passifValues,
    ["CA", "CD", "CH", "CJ", "CK"],
    "n1",
  );
  const totalDettesFinancieresN = sumN(passifValues, ["DA", "DB"], "n");
  const totalDettesFinancieresN1 = sumN(passifValues, ["DA", "DB"], "n1");
  const totalRessourcesStablesN =
    totalCapitauxPropresN + totalDettesFinancieresN;
  const totalRessourcesStablesN1 =
    totalCapitauxPropresN1 + totalDettesFinancieresN1;
  const totalPassifCirculantN = sumN(
    passifValues,
    ["DH", "DI", "DJ", "DK", "DM"],
    "n",
  );
  const totalPassifCirculantN1 = sumN(
    passifValues,
    ["DH", "DI", "DJ", "DK", "DM"],
    "n1",
  );
  const totalTresoreriePassifN = sumN(passifValues, ["DQ", "DR"], "n");
  const totalTresoreriePassifN1 = sumN(passifValues, ["DQ", "DR"], "n1");
  const totalGeneralPassifN =
    totalRessourcesStablesN + totalPassifCirculantN + totalTresoreriePassifN;
  const totalGeneralPassifN1 =
    totalRessourcesStablesN1 + totalPassifCirculantN1 + totalTresoreriePassifN1;

  const frN = totalRessourcesStablesN - totalActifImmobiliseN;
  const frN1 = totalRessourcesStablesN1 - totalActifImmobiliseN1;
  const bfrN = totalActifCirculantN - totalPassifCirculantN;
  const bfrN1 = totalActifCirculantN1 - totalPassifCirculantN1;
  const tnN = totalTresorerieActifN - totalTresoreriePassifN;
  const tnN1 = totalTresorerieActifN1 - totalTresoreriePassifN1;

  return {
    actif: {
      postes: actifPostes,
      totalActifImmobilise: withVariation(
        totalActifImmobiliseN,
        totalActifImmobiliseN1,
      ),
      totalActifCirculant: withVariation(
        totalActifCirculantN,
        totalActifCirculantN1,
      ),
      totalTresorerieActif: withVariation(
        totalTresorerieActifN,
        totalTresorerieActifN1,
      ),
      totalGeneralActif: withVariation(totalGeneralActifN, totalGeneralActifN1),
    },
    passif: {
      postes: passifPostes,
      totalCapitauxPropres: withVariation(
        totalCapitauxPropresN,
        totalCapitauxPropresN1,
      ),
      totalDettesFinancieres: withVariation(
        totalDettesFinancieresN,
        totalDettesFinancieresN1,
      ),
      totalRessourcesStables: withVariation(
        totalRessourcesStablesN,
        totalRessourcesStablesN1,
      ),
      totalPassifCirculant: withVariation(
        totalPassifCirculantN,
        totalPassifCirculantN1,
      ),
      totalTresoreriePassif: withVariation(
        totalTresoreriePassifN,
        totalTresoreriePassifN1,
      ),
      totalGeneralPassif: withVariation(
        totalGeneralPassifN,
        totalGeneralPassifN1,
      ),
    },
    equilibreFonctionnel: {
      fondsDeRoulement: { n: frN, n1: frN1 },
      besoinFondsDeRoulement: { n: bfrN, n1: bfrN1 },
      tresorerieNette: { n: tnN, n1: tnN1 },
      controle: { n: frN - bfrN - tnN, n1: frN1 - bfrN1 - tnN1 },
    },
  };
}
