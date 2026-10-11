import { BilanResult } from "./buildBilan";
import { ControlesResult } from "./buildControles";
import { ResultatResult } from "./buildResultat";

interface NoteCritere {
  label: string;
  valeur: number | null;
  note: number;
  bareme: string;
}

export interface SyntheseResult {
  indicateursCles: {
    label: string;
    n: number;
    n1: number;
    tendance: "▲ Hausse" | "▼ Baisse" | "=";
  }[];
  noteSante: {
    criteres: NoteCritere[];
    noteGlobale: number;
    appreciation: string;
  };
  pointsDeVigilance: { message: string; ok: boolean }[];
}

function tendance(n: number, n1: number): "▲ Hausse" | "▼ Baisse" | "=" {
  if (n === n1) return "=";
  return n > n1 ? "▲ Hausse" : "▼ Baisse";
}

export function buildSynthese(
  bilan: BilanResult,
  resultat: ResultatResult,
  controles: ControlesResult,
): SyntheseResult {
  const ca = resultat.chiffreAffaires;

  const indicateursCles: SyntheseResult["indicateursCles"] = [
    {
      label: "Chiffre d'affaires",
      n: ca.n,
      n1: ca.n1,
      tendance: tendance(ca.n, ca.n1),
    },
    {
      label: "Valeur ajoutée",
      n: resultat.valeurAjoutee.n,
      n1: resultat.valeurAjoutee.n1,
      tendance: tendance(resultat.valeurAjoutee.n, resultat.valeurAjoutee.n1),
    },
    {
      label: "Excédent brut d'exploitation",
      n: resultat.excedentBrutExploitation.n,
      n1: resultat.excedentBrutExploitation.n1,
      tendance: tendance(
        resultat.excedentBrutExploitation.n,
        resultat.excedentBrutExploitation.n1,
      ),
    },
    {
      label: "Résultat net",
      n: resultat.resultatNet.n,
      n1: resultat.resultatNet.n1,
      tendance: tendance(resultat.resultatNet.n, resultat.resultatNet.n1),
    },
    {
      label: "CAFG",
      n: resultat.cafg.n,
      n1: resultat.cafg.n1,
      tendance: tendance(resultat.cafg.n, resultat.cafg.n1),
    },
    {
      label: "Capitaux propres",
      n: bilan.passif.totalCapitauxPropres.n,
      n1: bilan.passif.totalCapitauxPropres.n1,
      tendance: tendance(
        bilan.passif.totalCapitauxPropres.n,
        bilan.passif.totalCapitauxPropres.n1,
      ),
    },
    {
      label: "Fonds de roulement",
      n: bilan.equilibreFonctionnel.fondsDeRoulement.n,
      n1: bilan.equilibreFonctionnel.fondsDeRoulement.n1,
      tendance: tendance(
        bilan.equilibreFonctionnel.fondsDeRoulement.n,
        bilan.equilibreFonctionnel.fondsDeRoulement.n1,
      ),
    },
    {
      label: "Besoin en fonds de roulement",
      n: bilan.equilibreFonctionnel.besoinFondsDeRoulement.n,
      n1: bilan.equilibreFonctionnel.besoinFondsDeRoulement.n1,
      tendance: tendance(
        bilan.equilibreFonctionnel.besoinFondsDeRoulement.n,
        bilan.equilibreFonctionnel.besoinFondsDeRoulement.n1,
      ),
    },
    {
      label: "Trésorerie nette",
      n: bilan.equilibreFonctionnel.tresorerieNette.n,
      n1: bilan.equilibreFonctionnel.tresorerieNette.n1,
      tendance: tendance(
        bilan.equilibreFonctionnel.tresorerieNette.n,
        bilan.equilibreFonctionnel.tresorerieNette.n1,
      ),
    },
  ];

  const autonomie =
    bilan.passif.totalGeneralPassif.n === 0
      ? null
      : bilan.passif.totalCapitauxPropres.n / bilan.passif.totalGeneralPassif.n;
  const noteAutonomie =
    autonomie === null
      ? 0
      : autonomie >= 0.4
        ? 4
        : autonomie >= 0.3
          ? 3
          : autonomie >= 0.2
            ? 2
            : autonomie >= 0.1
              ? 1
              : 0;

  const rentabiliteNette = ca.n === 0 ? null : resultat.resultatNet.n / ca.n;
  const noteRentabilite =
    rentabiliteNette === null
      ? 0
      : rentabiliteNette >= 0.08
        ? 4
        : rentabiliteNette >= 0.04
          ? 3
          : rentabiliteNette >= 0.01
            ? 2
            : rentabiliteNette > 0
              ? 1
              : 0;

  const denomLiquidite =
    bilan.passif.totalPassifCirculant.n + bilan.passif.totalTresoreriePassif.n;
  const liquiditeGenerale =
    denomLiquidite === 0
      ? null
      : (bilan.actif.totalActifCirculant.n +
          bilan.actif.totalTresorerieActif.n) /
        denomLiquidite;
  const noteLiquidite =
    liquiditeGenerale === null
      ? 0
      : liquiditeGenerale >= 1.5
        ? 4
        : liquiditeGenerale >= 1.2
          ? 3
          : liquiditeGenerale >= 1
            ? 2
            : liquiditeGenerale >= 0.8
              ? 1
              : 0;

  const tresorerieNette = bilan.equilibreFonctionnel.tresorerieNette.n;
  const noteTresorerie =
    tresorerieNette > 0 ? 4 : tresorerieNette === 0 ? 2 : 0;

  const couverture =
    bilan.actif.totalActifImmobilise.n === 0
      ? null
      : bilan.passif.totalRessourcesStables.n /
        bilan.actif.totalActifImmobilise.n;
  const noteCouverture =
    couverture === null
      ? 0
      : couverture >= 1.3
        ? 4
        : couverture >= 1.1
          ? 3
          : couverture >= 1
            ? 2
            : couverture >= 0.9
              ? 1
              : 0;

  const criteres: NoteCritere[] = [
    {
      label: "Autonomie financière (CP/Total passif)",
      valeur: autonomie,
      note: noteAutonomie,
      bareme: "≥40%→4 ; ≥30%→3 ; ≥20%→2 ; ≥10%→1",
    },
    {
      label: "Rentabilité nette (Rés. net/CA)",
      valeur: rentabiliteNette,
      note: noteRentabilite,
      bareme: "≥8%→4 ; ≥4%→3 ; ≥1%→2 ; >0→1",
    },
    {
      label: "Liquidité générale",
      valeur: liquiditeGenerale,
      note: noteLiquidite,
      bareme: "≥1,5→4 ; ≥1,2→3 ; ≥1→2 ; ≥0,8→1",
    },
    {
      label: "Trésorerie nette",
      valeur: tresorerieNette,
      note: noteTresorerie,
      bareme: ">0→4 ; =0→2 ; <0→0",
    },
    {
      label: "Couverture emplois stables (FR positif)",
      valeur: couverture,
      note: noteCouverture,
      bareme: "≥1,3→4 ; ≥1,1→3 ; ≥1→2 ; ≥0,9→1",
    },
  ];

  const noteGlobale = criteres.reduce((t, c) => t + c.note, 0);
  const appreciation =
    noteGlobale >= 16
      ? "Très bonne santé"
      : noteGlobale >= 12
        ? "Santé correcte"
        : noteGlobale >= 8
          ? "Fragile — vigilance"
          : noteGlobale >= 4
            ? "Préoccupante"
            : "Critique";

  const compteAttente47 = controles.comptesASurveiller.find(
    (c) => c.compte === "47",
  );
  const comptesCourants46 = controles.comptesASurveiller.find(
    (c) => c.compte === "46",
  );

  const pointsDeVigilance: SyntheseResult["pointsDeVigilance"] = [
    {
      ok: controles.ecartDebitCredit.equilibre,
      message: controles.ecartDebitCredit.equilibre
        ? "✓ Balance équilibrée (Débit = Crédit)"
        : `⚠ DÉSÉQUILIBRE balance : ${Math.round(controles.ecartDebitCredit.n)}`,
    },
    {
      ok: controles.ecartActifPassif.equilibre,
      message: controles.ecartActifPassif.equilibre
        ? "✓ Bilan équilibré (Actif = Passif)"
        : `⚠ Écart Actif/Passif : ${Math.round(controles.ecartActifPassif.n)}`,
    },
    {
      ok: Math.abs(compteAttente47?.soldeN ?? 0) < 1,
      message:
        Math.abs(compteAttente47?.soldeN ?? 0) < 1
          ? "✓ Comptes d'attente (47) soldés"
          : `⚠ Comptes d'attente 47 non soldés : ${Math.round(compteAttente47?.soldeN ?? 0)}`,
    },
    {
      ok: tresorerieNette >= 0,
      message:
        tresorerieNette >= 0
          ? "✓ Trésorerie nette positive"
          : `⚠ Trésorerie nette NÉGATIVE : ${Math.round(tresorerieNette)} — tension de liquidité`,
    },
    {
      ok: bilan.equilibreFonctionnel.fondsDeRoulement.n >= 0,
      message:
        bilan.equilibreFonctionnel.fondsDeRoulement.n >= 0
          ? "✓ Fonds de roulement positif"
          : "⚠ Fonds de roulement NÉGATIF : immobilisations mal financées",
    },
    {
      ok: bilan.passif.totalCapitauxPropres.n > 0,
      message:
        bilan.passif.totalCapitauxPropres.n > 0
          ? "✓ Capitaux propres positifs"
          : "⚠ CAPITAUX PROPRES NÉGATIFS — situation nette compromise",
    },
    {
      ok: resultat.resultatNet.n >= 0,
      message:
        resultat.resultatNet.n >= 0
          ? "✓ Résultat net bénéficiaire"
          : "⚠ Résultat net DÉFICITAIRE",
    },
    {
      ok: (comptesCourants46?.soldeN ?? 0) === 0,
      message:
        (comptesCourants46?.soldeN ?? 0) === 0
          ? "✓ Comptes courants associés : néant"
          : `ℹ Comptes courants associés (46) : ${Math.round(comptesCourants46?.soldeN ?? 0)} — vérifier déductibilité intérêts`,
    },
  ];

  return {
    indicateursCles,
    noteSante: { criteres, noteGlobale, appreciation },
    pointsDeVigilance,
  };
}
