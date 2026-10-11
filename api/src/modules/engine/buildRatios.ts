import { BilanResult } from "./buildBilan";
import { ResultatResult } from "./buildResultat";
import { RatioResult } from "./engine.types";

function ratio(n: number, d: number): number | null {
  if (d === 0) return null;
  return n / d;
}

export interface RatiosResult {
  structureSolvabilite: {
    autonomieFinanciere: RatioResult;
    endettement: RatioResult;
    couvertureEmploisStables: RatioResult;
    capaciteRemboursement: RatioResult;
  };
  liquidite: {
    liquiditeGenerale: RatioResult;
    liquiditeReduite: RatioResult;
    liquiditeImmediate: RatioResult;
  };
  gestion: {
    delaiClients: RatioResult;
    delaiFournisseurs: RatioResult;
    rotationStocks: RatioResult;
  };
  rentabilite: {
    tauxValeurAjoutee: RatioResult;
    tauxMargeEBE: RatioResult;
    margeNette: RatioResult;
    roe: RatioResult;
    rentabiliteEconomique: RatioResult;
    poidsChargesPersonnel: RatioResult;
  };
}

export function buildRatios(
  bilan: BilanResult,
  resultat: ResultatResult,
): RatiosResult {
  const { actif, passif } = bilan;
  const ca = resultat.chiffreAffaires;
  const achatsN = resultat.postes.RA.n + resultat.postes.RC.n;
  const achatsN1 = resultat.postes.RA.n1 + resultat.postes.RC.n1;

  const autonomieN = ratio(
    passif.totalCapitauxPropres.n,
    passif.totalGeneralPassif.n,
  );
  const autonomieN1 = ratio(
    passif.totalCapitauxPropres.n1,
    passif.totalGeneralPassif.n1,
  );
  const endettementN = ratio(
    passif.totalDettesFinancieres.n,
    passif.totalCapitauxPropres.n,
  );
  const endettementN1 = ratio(
    passif.totalDettesFinancieres.n1,
    passif.totalCapitauxPropres.n1,
  );
  const couvertureN = ratio(
    passif.totalRessourcesStables.n,
    actif.totalActifImmobilise.n,
  );
  const couvertureN1 = ratio(
    passif.totalRessourcesStables.n1,
    actif.totalActifImmobilise.n1,
  );
  const capaciteRembN =
    resultat.cafg.n > 0
      ? ratio(passif.totalDettesFinancieres.n, resultat.cafg.n)
      : null;
  const capaciteRembN1 =
    resultat.cafg.n1 > 0
      ? ratio(passif.totalDettesFinancieres.n1, resultat.cafg.n1)
      : null;

  const denomLiquiditeN =
    passif.totalPassifCirculant.n + passif.totalTresoreriePassif.n;
  const denomLiquiditeN1 =
    passif.totalPassifCirculant.n1 + passif.totalTresoreriePassif.n1;
  const liquiditeGeneraleN = ratio(
    actif.totalActifCirculant.n + actif.totalTresorerieActif.n,
    denomLiquiditeN,
  );
  const liquiditeGeneraleN1 = ratio(
    actif.totalActifCirculant.n1 + actif.totalTresorerieActif.n1,
    denomLiquiditeN1,
  );

  const stocksN = actif.postes.BB.n;
  const stocksN1 = actif.postes.BB.n1;
  const liquiditeReduiteN = ratio(
    actif.totalActifCirculant.n - stocksN + actif.totalTresorerieActif.n,
    denomLiquiditeN,
  );
  const liquiditeReduiteN1 = ratio(
    actif.totalActifCirculant.n1 - stocksN1 + actif.totalTresorerieActif.n1,
    denomLiquiditeN1,
  );
  const liquiditeImmediateN = ratio(
    actif.totalTresorerieActif.n,
    denomLiquiditeN,
  );
  const liquiditeImmediateN1 = ratio(
    actif.totalTresorerieActif.n1,
    denomLiquiditeN1,
  );

  const creancesClientsN = actif.postes.BG.n;
  const creancesClientsN1 = actif.postes.BG.n1;
  const delaiClientsN = ca.n !== 0 ? (creancesClientsN / ca.n) * 360 : null;
  const delaiClientsN1 = ca.n1 !== 0 ? (creancesClientsN1 / ca.n1) * 360 : null;

  const dettesFournisseursN = passif.postes.DJ.n;
  const dettesFournisseursN1 = passif.postes.DJ.n1;
  const delaiFournisseursN =
    achatsN !== 0 ? (dettesFournisseursN / achatsN) * 360 : null;
  const delaiFournisseursN1 =
    achatsN1 !== 0 ? (dettesFournisseursN1 / achatsN1) * 360 : null;

  const rotationStocksN = ca.n !== 0 ? (stocksN / ca.n) * 360 : null;
  const rotationStocksN1 = ca.n1 !== 0 ? (stocksN1 / ca.n1) * 360 : null;

  const tauxVAN = ratio(resultat.valeurAjoutee.n, ca.n);
  const tauxVAN1 = ratio(resultat.valeurAjoutee.n1, ca.n1);
  const tauxEBEN = ratio(resultat.excedentBrutExploitation.n, ca.n);
  const tauxEBEN1 = ratio(resultat.excedentBrutExploitation.n1, ca.n1);
  const margeNetteN = ratio(resultat.resultatNet.n, ca.n);
  const margeNetteN1 = ratio(resultat.resultatNet.n1, ca.n1);
  const roeN = ratio(resultat.resultatNet.n, passif.totalCapitauxPropres.n);
  const roeN1 = ratio(resultat.resultatNet.n1, passif.totalCapitauxPropres.n1);
  const rentaEcoN = ratio(
    resultat.resultatExploitation.n,
    actif.totalGeneralActif.n,
  );
  const rentaEcoN1 = ratio(
    resultat.resultatExploitation.n1,
    actif.totalGeneralActif.n1,
  );
  const poidsPersonnelN = ratio(resultat.postes.RI.n, resultat.valeurAjoutee.n);
  const poidsPersonnelN1 = ratio(
    resultat.postes.RI.n1,
    resultat.valeurAjoutee.n1,
  );

  return {
    structureSolvabilite: {
      autonomieFinanciere: {
        label: "Autonomie financière (CP / Total passif)",
        n: autonomieN,
        n1: autonomieN1,
        norme: "> 20–30 %",
        appreciation:
          autonomieN === null
            ? ""
            : autonomieN >= 0.3
              ? "Solide"
              : autonomieN >= 0.2
                ? "Acceptable"
                : "Faible",
      },
      endettement: {
        label: "Endettement (Dettes fin. / CP)",
        n: endettementN,
        n1: endettementN1,
        norme: "< 1,0x",
        appreciation:
          endettementN === null
            ? ""
            : endettementN <= 1
              ? "Maîtrisé"
              : endettementN <= 2
                ? "Élevé"
                : "Critique",
      },
      couvertureEmploisStables: {
        label: "Couverture emplois stables (Ress. st. / Actif imm.)",
        n: couvertureN,
        n1: couvertureN1,
        norme: "> 1,0x",
        appreciation:
          couvertureN === null
            ? ""
            : couvertureN >= 1
              ? "FR positif"
              : "FR négatif",
      },
      capaciteRemboursement: {
        label: "Capacité de remboursement (Dettes fin. / CAFG)",
        n: capaciteRembN,
        n1: capaciteRembN1,
        norme: "< 4 ans",
        appreciation:
          capaciteRembN === null
            ? ""
            : capaciteRembN <= 4
              ? "Sain"
              : capaciteRembN <= 5
                ? "Limite"
                : "Risqué",
      },
    },
    liquidite: {
      liquiditeGenerale: {
        label: "Liquidité générale (AC+Trés.A / PC+Trés.P)",
        n: liquiditeGeneraleN,
        n1: liquiditeGeneraleN1,
        norme: "> 1,0x",
        appreciation:
          liquiditeGeneraleN === null
            ? ""
            : liquiditeGeneraleN >= 1.2
              ? "Confortable"
              : liquiditeGeneraleN >= 1
                ? "Correct"
                : "Tendu",
      },
      liquiditeReduite: {
        label: "Liquidité réduite ((AC−Stocks)+Trés.A / PC+Trés.P)",
        n: liquiditeReduiteN,
        n1: liquiditeReduiteN1,
        norme: "> 0,8x",
        appreciation:
          liquiditeReduiteN === null
            ? ""
            : liquiditeReduiteN >= 0.8
              ? "Correct"
              : "Tendu",
      },
      liquiditeImmediate: {
        label: "Liquidité immédiate (Trés.A / PC+Trés.P)",
        n: liquiditeImmediateN,
        n1: liquiditeImmediateN1,
        norme: "> 0,2x",
        appreciation:
          liquiditeImmediateN === null
            ? ""
            : liquiditeImmediateN >= 0.2
              ? "OK"
              : "Faible",
      },
    },
    gestion: {
      delaiClients: {
        label: "Délai clients (Créances clients/CA × 360)",
        n: delaiClientsN,
        n1: delaiClientsN1,
        norme: "Court = mieux",
        appreciation:
          delaiClientsN === null
            ? ""
            : delaiClientsN <= 60
              ? "Bon"
              : delaiClientsN <= 90
                ? "Moyen"
                : "Long",
      },
      delaiFournisseurs: {
        label: "Délai fournisseurs (Dettes fourn./Achats × 360)",
        n: delaiFournisseursN,
        n1: delaiFournisseursN1,
        norme: "Indicatif",
        appreciation: "—",
      },
      rotationStocks: {
        label: "Rotation des stocks (Stocks/CA × 360)",
        n: rotationStocksN,
        n1: rotationStocksN1,
        norme: "Court = mieux",
        appreciation: "—",
      },
    },
    rentabilite: {
      tauxValeurAjoutee: {
        label: "Taux de valeur ajoutée (VA / CA)",
        n: tauxVAN,
        n1: tauxVAN1,
        norme: "Variable secteur",
        appreciation: "—",
      },
      tauxMargeEBE: {
        label: "Taux de marge d'EBE (EBE / CA)",
        n: tauxEBEN,
        n1: tauxEBEN1,
        norme: "> 0",
        appreciation:
          tauxEBEN === null ? "" : tauxEBEN > 0 ? "Positif" : "Négatif",
      },
      margeNette: {
        label: "Marge nette (Résultat net / CA)",
        n: margeNetteN,
        n1: margeNetteN1,
        norme: "> 0",
        appreciation:
          margeNetteN === null ? "" : margeNetteN > 0 ? "Bénéfice" : "Perte",
      },
      roe: {
        label: "Rentabilité financière ROE (Rés. net / CP)",
        n: roeN,
        n1: roeN1,
        norme: "> coût des FP",
        appreciation: "—",
      },
      rentabiliteEconomique: {
        label: "Rentabilité économique (Rés. expl. / Actif total)",
        n: rentaEcoN,
        n1: rentaEcoN1,
        norme: "> 0",
        appreciation: "—",
      },
      poidsChargesPersonnel: {
        label: "Poids charges de personnel (Pers. / VA)",
        n: poidsPersonnelN,
        n1: poidsPersonnelN1,
        norme: "< 100 %",
        appreciation:
          poidsPersonnelN === null
            ? ""
            : poidsPersonnelN < 0.7
              ? "Maîtrisé"
              : poidsPersonnelN < 1
                ? "Élevé"
                : "Excessif",
      },
    },
  };
}
