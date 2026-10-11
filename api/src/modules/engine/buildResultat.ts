import { EnrichedBalanceLine } from "./engine.types";
import { computePostes } from "./engine.utils";
import { RESULTAT_POSTES } from "./posteDefinitions.resultat";

interface SIGLine {
  label: string;
  n: number;
  n1: number;
}

export interface ResultatResult {
  postes: Record<string, { label: string; n: number; n1: number }>;
  chiffreAffaires: { n: number; n1: number };
  margeCommerciale: SIGLine;
  valeurAjoutee: SIGLine;
  excedentBrutExploitation: SIGLine;
  resultatExploitation: SIGLine;
  resultatFinancier: SIGLine;
  resultatActivitesOrdinaires: SIGLine;
  resultatHAO: SIGLine;
  resultatNet: SIGLine;
  cafg: SIGLine;
}

export function buildResultat(lines: EnrichedBalanceLine[]): ResultatResult {
  const v = computePostes(lines, RESULTAT_POSTES);
  const get = (ref: string, key: "n" | "n1") => v[ref]?.[key] ?? 0;

  const caN = get("TA", "n") + get("TB", "n");
  const caN1 = get("TA", "n1") + get("TB", "n1");

  const margeN = get("TA", "n") - get("RA", "n") - get("RB", "n");
  const margeN1 = get("TA", "n1") - get("RA", "n1") - get("RB", "n1");

  const vaN =
    margeN +
    get("TB", "n") +
    get("TC", "n") +
    get("TD", "n") -
    get("RC", "n") -
    get("RD", "n") -
    get("RE", "n") -
    get("RF", "n") -
    get("RG", "n");
  const vaN1 =
    margeN1 +
    get("TB", "n1") +
    get("TC", "n1") +
    get("TD", "n1") -
    get("RC", "n1") -
    get("RD", "n1") -
    get("RE", "n1") -
    get("RF", "n1") -
    get("RG", "n1");

  const ebeN = vaN - get("RH", "n") - get("RI", "n");
  const ebeN1 = vaN1 - get("RH", "n1") - get("RI", "n1");

  const resExploitN = ebeN + get("TE", "n") - get("RJ", "n");
  const resExploitN1 = ebeN1 + get("TE", "n1") - get("RJ", "n1");

  const resFinancierN = get("TF", "n") - get("RK", "n");
  const resFinancierN1 = get("TF", "n1") - get("RK", "n1");

  const raoN = resExploitN + resFinancierN;
  const raoN1 = resExploitN1 + resFinancierN1;

  const resHaoN = get("TH", "n") - get("RL", "n");
  const resHaoN1 = get("TH", "n1") - get("RL", "n1");

  const resNetN = raoN + resHaoN - get("RM", "n") - get("RN", "n");
  const resNetN1 = raoN1 + resHaoN1 - get("RM", "n1") - get("RN", "n1");

  const cafgN = resNetN + get("RJ", "n") - get("TE", "n");
  const cafgN1 = resNetN1 + get("RJ", "n1") - get("TE", "n1");

  const postes: ResultatResult["postes"] = {};
  for (const p of RESULTAT_POSTES) {
    postes[p.ref] = { label: p.label, n: v[p.ref].n, n1: v[p.ref].n1 };
  }

  return {
    postes,
    chiffreAffaires: { n: caN, n1: caN1 },
    margeCommerciale: { label: "MARGE COMMERCIALE", n: margeN, n1: margeN1 },
    valeurAjoutee: { label: "VALEUR AJOUTÉE", n: vaN, n1: vaN1 },
    excedentBrutExploitation: {
      label: "EXCÉDENT BRUT D'EXPLOITATION (EBE)",
      n: ebeN,
      n1: ebeN1,
    },
    resultatExploitation: {
      label: "RÉSULTAT D'EXPLOITATION",
      n: resExploitN,
      n1: resExploitN1,
    },
    resultatFinancier: {
      label: "RÉSULTAT FINANCIER",
      n: resFinancierN,
      n1: resFinancierN1,
    },
    resultatActivitesOrdinaires: {
      label: "RÉSULTAT DES ACTIVITÉS ORDINAIRES",
      n: raoN,
      n1: raoN1,
    },
    resultatHAO: { label: "RÉSULTAT H.A.O.", n: resHaoN, n1: resHaoN1 },
    resultatNet: {
      label: "RÉSULTAT NET DE L'EXERCICE",
      n: resNetN,
      n1: resNetN1,
    },
    cafg: {
      label: "CAPACITÉ D'AUTOFINANCEMENT GLOBALE (CAFG)",
      n: cafgN,
      n1: cafgN1,
    },
  };
}
