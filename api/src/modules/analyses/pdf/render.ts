import { FullReport } from "@/modules/engine/buildReport";
import {
  formatAmountForPdf as formatAmount,
  sanitizeForPdf as clean,
} from "@/utils/pdfText";
import { drawCompanyLogo } from "@/utils/pdfLogo";

/**
 * Chaque catégorie de ratios mélange en réalité des unités différentes
 * (buildRatios.ts) : pourcentages (autonomie, rentabilité), multiplicateurs
 * (endettement, couverture, liquidité), jours (délais clients/fournisseurs,
 * rotation stocks) et années (capacité de remboursement). Formater tout en %
 * comme une première version l'a fait donnerait des non-sens du type "délai
 * clients : 7200%" — chaque ratio a son unité propre, définie ici une seule
 * fois plutôt que dispersée dans le rendu.
 */
type RatioUnit = "percent" | "multiplier" | "days" | "years";
const RATIO_UNITS: Record<string, RatioUnit> = {
  autonomieFinanciere: "percent",
  endettement: "multiplier",
  couvertureEmploisStables: "multiplier",
  capaciteRemboursement: "years",
  liquiditeGenerale: "multiplier",
  liquiditeReduite: "multiplier",
  liquiditeImmediate: "multiplier",
  delaiClients: "days",
  delaiFournisseurs: "days",
  rotationStocks: "days",
  tauxValeurAjoutee: "percent",
  tauxMargeEBE: "percent",
  margeNette: "percent",
  roe: "percent",
  rentabiliteEconomique: "percent",
  poidsChargesPersonnel: "percent",
};

function formatRatio(value: number | null, unit: RatioUnit): string {
  if (value === null) return "—";
  switch (unit) {
    case "percent":
      return `${(value * 100).toFixed(1)}%`;
    case "multiplier":
      return `${value.toFixed(2)}x`;
    case "days":
      return `${Math.round(value)} j`;
    case "years":
      return `${value.toFixed(1)} ans`;
  }
}

function sectionTitle(pdf: PDFKit.PDFDocument, title: string) {
  pdf.moveDown(1);
  pdf.font("Helvetica-Bold").fontSize(15).fillColor("#000").text(title);
  pdf
    .moveTo(pdf.x, pdf.y + 2)
    .lineTo(545, pdf.y + 2)
    .strokeColor("#ccc")
    .stroke();
  pdf.moveDown(0.6);
}

function ensureSpace(pdf: PDFKit.PDFDocument, needed: number) {
  const bottom = pdf.page.height - pdf.page.margins.bottom;
  if (pdf.y + needed > bottom) pdf.addPage();
}

/**
 * Table à 3 colonnes (libellé, N, N1) avec positionnement explicite par
 * cellule — pdfkit n'aligne pas correctement des colonnes via `continued`
 * (vérifié empiriquement sur le module Business Plan). Tout texte passé ici
 * est nettoyé (`clean`) : les libellés du moteur contiennent des caractères
 * (tiret moins U+2212, flèches...) absents de l'encodage WinAnsi de pdfkit.
 */
function threeColTable(
  pdf: PDFKit.PDFDocument,
  rows: { label: string; n: string; n1: string; bold?: boolean }[],
  options: {
    header?: boolean;
    exerciceNLabel?: string;
    exerciceN1Label?: string;
  } = {},
) {
  const labelWidth = 300;
  const colWidth = 95;
  const nX = 50 + labelWidth;
  const n1X = nX + colWidth;

  if (options.header) {
    ensureSpace(pdf, 16);
    const y = pdf.y;
    pdf.font("Helvetica-Bold").fontSize(8).fillColor("#666");
    pdf.text("", 50, y, { width: labelWidth });
    pdf.text(clean(options.exerciceNLabel ?? "N"), nX, y, {
      width: colWidth,
      align: "right",
    });
    pdf.text(clean(options.exerciceN1Label ?? "N-1"), n1X, y, {
      width: colWidth,
      align: "right",
    });
    pdf.x = 50;
    pdf.y = y + 12;
    pdf.moveTo(50, pdf.y).lineTo(545, pdf.y).strokeColor("#ccc").stroke();
    pdf.moveDown(0.2);
    pdf.fillColor("#000");
  }

  for (const row of rows) {
    ensureSpace(pdf, 15);
    const y = pdf.y;
    const font = row.bold ? "Helvetica-Bold" : "Helvetica";
    const label = clean(row.label);
    pdf.font(font).fontSize(9);
    const rowHeight = pdf.heightOfString(label, { width: labelWidth });
    pdf.text(label, 50, y, { width: labelWidth });
    pdf.text(clean(row.n), nX, y, { width: colWidth, align: "right" });
    pdf.text(clean(row.n1), n1X, y, { width: colWidth, align: "right" });
    pdf.x = 50;
    pdf.y = y + Math.max(rowHeight, 13);
  }
}

/**
 * Ligne "libellé (gauche, retour à la ligne si besoin) / valeur (droite) puis
 * une ligne de commentaire pleine largeur en dessous" — utilisée pour les
 * comptes à surveiller, où le commentaire est trop long pour tenir dans une
 * colonne étroite façon `threeColTable`.
 */
function labelValueCommentRow(
  pdf: PDFKit.PDFDocument,
  label: string,
  value: string,
  comment: string,
) {
  ensureSpace(pdf, 30);
  const labelWidth = 350;
  const valueX = 400;
  const valueWidth = 145;
  const startY = pdf.y;
  pdf.font("Helvetica").fontSize(9);
  const labelHeight = pdf.heightOfString(clean(label), { width: labelWidth });
  pdf.text(clean(label), 50, startY, { width: labelWidth });
  pdf.text(clean(value), valueX, startY, { width: valueWidth, align: "right" });
  pdf.x = 50;
  pdf.y = startY + Math.max(labelHeight, 12);
  pdf
    .font("Helvetica-Oblique")
    .fontSize(8)
    .fillColor("#666")
    .text(clean(comment), 50, pdf.y, { width: 495 });
  pdf.fillColor("#000");
  pdf.moveDown(0.3);
}

export interface FinancialStatementsPdfData {
  analysis: {
    label: string;
    exerciceNDate: Date;
    exerciceN1Date: Date | null;
    analystName: string | null;
  };
  company: { name: string; currency: string; logoUrl?: string | null };
  report: FullReport;
}

/** Rendu PUR des états financiers — aucun accès base de données (voir pdf.service.ts). */
export function renderFinancialStatementsPdf(
  pdf: PDFKit.PDFDocument,
  data: FinancialStatementsPdfData,
): void {
  const { analysis, company, report } = data;
  const { controles, bilan, resultat, ratios, synthese } = report;
  const currency = company.currency;
  const exerciceNLabel = new Date(analysis.exerciceNDate)
    .getFullYear()
    .toString();
  const exerciceN1Label = analysis.exerciceN1Date
    ? new Date(analysis.exerciceN1Date).getFullYear().toString()
    : "N-1";
  const amt = (v: number) => formatAmount(v, currency);

  // ---------- Page de garde ----------
  if (company.logoUrl) {
    drawCompanyLogo(pdf, company.logoUrl, {
      x: (595 - 120) / 2,
      y: pdf.y,
      maxWidth: 120,
      maxHeight: 70,
    });
    pdf.moveDown(4.5);
  }
  pdf
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("États financiers", { align: "center" });
  pdf.moveDown(0.3);
  pdf
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#555")
    .text(clean(analysis.label), { align: "center" });
  pdf.moveDown(1.5);
  pdf.fontSize(10).fillColor("#000");
  pdf.text(clean(`Entreprise : ${company.name}`), { align: "center" });
  pdf.text(
    `Exercice N : ${exerciceNLabel}${analysis.exerciceN1Date ? ` - Exercice N-1 : ${exerciceN1Label}` : ""}`,
    { align: "center" },
  );
  if (analysis.analystName)
    pdf.text(clean(`Analyste : ${analysis.analystName}`), { align: "center" });
  pdf.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, {
    align: "center",
  });

  // ---------- Contrôles de cohérence ----------
  pdf.addPage();
  sectionTitle(pdf, "Contrôles de cohérence");
  threeColTable(
    pdf,
    [
      {
        label: "Total débit",
        n: amt(controles.totalDebit.n),
        n1: amt(controles.totalDebit.n1),
      },
      {
        label: "Total crédit",
        n: amt(controles.totalCredit.n),
        n1: amt(controles.totalCredit.n1),
      },
      {
        label: "Écart débit/crédit",
        n: amt(controles.ecartDebitCredit.n),
        n1: amt(controles.ecartDebitCredit.n1),
        bold: true,
      },
      {
        label: "Total actif",
        n: amt(controles.totalActif.n),
        n1: amt(controles.totalActif.n1),
      },
      {
        label: "Total passif",
        n: amt(controles.totalPassif.n),
        n1: amt(controles.totalPassif.n1),
      },
      {
        label: "Écart actif/passif",
        n: amt(controles.ecartActifPassif.n),
        n1: amt(controles.ecartActifPassif.n1),
        bold: true,
      },
    ],
    { header: true, exerciceNLabel, exerciceN1Label },
  );
  pdf.moveDown(0.4);
  pdf
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      clean(
        `Balance : ${controles.ecartDebitCredit.equilibre ? "✓ équilibrée" : "⚠ DÉSÉQUILIBRÉE"}    Bilan : ${controles.ecartActifPassif.equilibre ? "✓ équilibré" : "⚠ DÉSÉQUILIBRÉ"}`,
      ),
    );

  if (controles.comptesASurveiller.length > 0) {
    pdf.moveDown(0.8);
    pdf.font("Helvetica-Bold").fontSize(11).text("Comptes à surveiller");
    pdf.moveDown(0.2);
    for (const c of controles.comptesASurveiller) {
      labelValueCommentRow(
        pdf,
        `${c.compte} — ${c.label}`,
        amt(c.soldeN),
        c.vigilance,
      );
    }
  }

  // ---------- Bilan ----------
  pdf.addPage();
  sectionTitle(pdf, "Bilan — Actif");
  threeColTable(
    pdf,
    [
      ...Object.values(bilan.actif.postes).map((p) => ({
        label: p.label,
        n: amt(p.n),
        n1: amt(p.n1),
      })),
      {
        label: "TOTAL ACTIF IMMOBILISÉ",
        n: amt(bilan.actif.totalActifImmobilise.n),
        n1: amt(bilan.actif.totalActifImmobilise.n1),
        bold: true,
      },
      {
        label: "TOTAL ACTIF CIRCULANT",
        n: amt(bilan.actif.totalActifCirculant.n),
        n1: amt(bilan.actif.totalActifCirculant.n1),
        bold: true,
      },
      {
        label: "TOTAL TRÉSORERIE ACTIF",
        n: amt(bilan.actif.totalTresorerieActif.n),
        n1: amt(bilan.actif.totalTresorerieActif.n1),
        bold: true,
      },
      {
        label: "TOTAL GÉNÉRAL ACTIF",
        n: amt(bilan.actif.totalGeneralActif.n),
        n1: amt(bilan.actif.totalGeneralActif.n1),
        bold: true,
      },
    ],
    { header: true, exerciceNLabel, exerciceN1Label },
  );

  pdf.addPage();
  sectionTitle(pdf, "Bilan — Passif");
  threeColTable(
    pdf,
    [
      ...Object.values(bilan.passif.postes).map((p) => ({
        label: p.label,
        n: amt(p.n),
        n1: amt(p.n1),
      })),
      {
        label: "TOTAL CAPITAUX PROPRES",
        n: amt(bilan.passif.totalCapitauxPropres.n),
        n1: amt(bilan.passif.totalCapitauxPropres.n1),
        bold: true,
      },
      {
        label: "TOTAL DETTES FINANCIÈRES",
        n: amt(bilan.passif.totalDettesFinancieres.n),
        n1: amt(bilan.passif.totalDettesFinancieres.n1),
        bold: true,
      },
      {
        label: "TOTAL RESSOURCES STABLES",
        n: amt(bilan.passif.totalRessourcesStables.n),
        n1: amt(bilan.passif.totalRessourcesStables.n1),
        bold: true,
      },
      {
        label: "TOTAL PASSIF CIRCULANT",
        n: amt(bilan.passif.totalPassifCirculant.n),
        n1: amt(bilan.passif.totalPassifCirculant.n1),
        bold: true,
      },
      {
        label: "TOTAL TRÉSORERIE PASSIF",
        n: amt(bilan.passif.totalTresoreriePassif.n),
        n1: amt(bilan.passif.totalTresoreriePassif.n1),
        bold: true,
      },
      {
        label: "TOTAL GÉNÉRAL PASSIF",
        n: amt(bilan.passif.totalGeneralPassif.n),
        n1: amt(bilan.passif.totalGeneralPassif.n1),
        bold: true,
      },
    ],
    { header: true, exerciceNLabel, exerciceN1Label },
  );

  pdf.moveDown(0.8);
  pdf.font("Helvetica-Bold").fontSize(11).text("Équilibre fonctionnel");
  pdf.moveDown(0.2);
  threeColTable(pdf, [
    {
      label: "Fonds de roulement (FR)",
      n: amt(bilan.equilibreFonctionnel.fondsDeRoulement.n),
      n1: amt(bilan.equilibreFonctionnel.fondsDeRoulement.n1),
    },
    {
      label: "Besoin en fonds de roulement (BFR)",
      n: amt(bilan.equilibreFonctionnel.besoinFondsDeRoulement.n),
      n1: amt(bilan.equilibreFonctionnel.besoinFondsDeRoulement.n1),
    },
    {
      label: "Trésorerie nette (TN)",
      n: amt(bilan.equilibreFonctionnel.tresorerieNette.n),
      n1: amt(bilan.equilibreFonctionnel.tresorerieNette.n1),
      bold: true,
    },
  ]);

  // ---------- Compte de résultat / SIG ----------
  pdf.addPage();
  sectionTitle(pdf, "Compte de résultat — Soldes intermédiaires de gestion");
  threeColTable(
    pdf,
    [
      {
        label: "Chiffre d'affaires",
        n: amt(resultat.chiffreAffaires.n),
        n1: amt(resultat.chiffreAffaires.n1),
        bold: true,
      },
      {
        label: resultat.margeCommerciale.label,
        n: amt(resultat.margeCommerciale.n),
        n1: amt(resultat.margeCommerciale.n1),
        bold: true,
      },
      {
        label: resultat.valeurAjoutee.label,
        n: amt(resultat.valeurAjoutee.n),
        n1: amt(resultat.valeurAjoutee.n1),
        bold: true,
      },
      {
        label: resultat.excedentBrutExploitation.label,
        n: amt(resultat.excedentBrutExploitation.n),
        n1: amt(resultat.excedentBrutExploitation.n1),
        bold: true,
      },
      {
        label: resultat.resultatExploitation.label,
        n: amt(resultat.resultatExploitation.n),
        n1: amt(resultat.resultatExploitation.n1),
        bold: true,
      },
      {
        label: resultat.resultatFinancier.label,
        n: amt(resultat.resultatFinancier.n),
        n1: amt(resultat.resultatFinancier.n1),
      },
      {
        label: resultat.resultatActivitesOrdinaires.label,
        n: amt(resultat.resultatActivitesOrdinaires.n),
        n1: amt(resultat.resultatActivitesOrdinaires.n1),
        bold: true,
      },
      {
        label: resultat.resultatHAO.label,
        n: amt(resultat.resultatHAO.n),
        n1: amt(resultat.resultatHAO.n1),
      },
      {
        label: resultat.resultatNet.label,
        n: amt(resultat.resultatNet.n),
        n1: amt(resultat.resultatNet.n1),
        bold: true,
      },
      {
        label: resultat.cafg.label,
        n: amt(resultat.cafg.n),
        n1: amt(resultat.cafg.n1),
        bold: true,
      },
    ],
    { header: true, exerciceNLabel, exerciceN1Label },
  );

  pdf.moveDown(0.8);
  pdf.font("Helvetica-Bold").fontSize(11).text("Détail des postes");
  pdf.moveDown(0.2);
  threeColTable(
    pdf,
    Object.values(resultat.postes).map((p) => ({
      label: p.label,
      n: amt(p.n),
      n1: amt(p.n1),
    })),
  );

  // ---------- Ratios ----------
  pdf.addPage();
  sectionTitle(pdf, "Ratios financiers");
  const ratioCategories: {
    title: string;
    entries: [
      string,
      {
        label: string;
        n: number | null;
        n1: number | null;
        appreciation: string;
      },
    ][];
  }[] = [
    {
      title: "Structure & solvabilité",
      entries: Object.entries(ratios.structureSolvabilite),
    },
    { title: "Liquidité", entries: Object.entries(ratios.liquidite) },
    { title: "Gestion", entries: Object.entries(ratios.gestion) },
    { title: "Rentabilité", entries: Object.entries(ratios.rentabilite) },
  ];
  for (const cat of ratioCategories) {
    ensureSpace(pdf, 30);
    pdf.font("Helvetica-Bold").fontSize(11).text(cat.title);
    pdf.moveDown(0.2);
    threeColTable(
      pdf,
      cat.entries.map(([key, r]) => {
        const unit = RATIO_UNITS[key] ?? "multiplier";
        return {
          label: `${r.label}${r.appreciation && r.appreciation !== "—" ? ` (${r.appreciation})` : ""}`,
          n: formatRatio(r.n, unit),
          n1: formatRatio(r.n1, unit),
        };
      }),
    );
    pdf.moveDown(0.5);
  }

  // ---------- Synthèse ----------
  pdf.addPage();
  sectionTitle(pdf, "Synthèse & indicateurs clés");
  threeColTable(
    pdf,
    synthese.indicateursCles.map((ind) => ({
      label: `${ind.label} ${ind.tendance}`,
      n: amt(ind.n),
      n1: amt(ind.n1),
    })),
    { header: true, exerciceNLabel, exerciceN1Label },
  );

  pdf.moveDown(0.8);
  ensureSpace(pdf, 40);
  pdf
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(
      `Note de santé financière : ${synthese.noteSante.noteGlobale} / 20 - ${clean(synthese.noteSante.appreciation)}`,
    );
  pdf.moveDown(0.3);
  for (const c of synthese.noteSante.criteres) {
    ensureSpace(pdf, 14);
    pdf
      .font("Helvetica")
      .fontSize(9)
      .text(clean(`${c.label} : ${c.note}/4  (${c.bareme})`));
  }

  pdf.moveDown(0.8);
  ensureSpace(pdf, 30);
  pdf.font("Helvetica-Bold").fontSize(11).text("Points de vigilance");
  pdf.moveDown(0.2);
  for (const p of synthese.pointsDeVigilance) {
    ensureSpace(pdf, 14);
    pdf.font("Helvetica").fontSize(9).text(clean(p.message));
  }

  // ---------- Pagination ----------
  // Le pied de page est écrit à page.height - 35, DANS la zone de marge
  // inférieure (marge de 50) — un choix normal pour un numéro de page. Sans
  // cette neutralisation temporaire, PDFKit détecte que cette position
  // dépasse `page.height - margins.bottom` et déclenche AUTOMATIQUEMENT un
  // saut de page avant d'écrire, créant une page vide à chaque fois : sur un
  // document de 7 pages, ce bug produit exactement 7 pages fantômes
  // supplémentaires (une par pied de page raté), soit 14 pages au total —
  // les 7 premières jamais numérotées (le texte en a été détourné), les 7
  // suivantes vides à part le numéro qui y a atterri par erreur.
  const pageCount = pdf.bufferedPageRange().count;
  const originalBottomMargin = pdf.page.margins.bottom;
  for (let i = 0; i < pageCount; i++) {
    pdf.switchToPage(i);
    pdf.page.margins.bottom = 0;
    pdf
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#999")
      .text(`${i + 1} / ${pageCount}`, 50, pdf.page.height - 35, {
        align: "center",
        width: 495,
      });
    pdf.page.margins.bottom = originalBottomMargin;
  }
}
