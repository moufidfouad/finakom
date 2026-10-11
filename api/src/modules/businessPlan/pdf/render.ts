import { getBusinessPlanSummary } from "@/modules/businessPlan/summary/summary.service";
import { renderHtml } from "./htmlToPdf";
import { drawCompanyLogo } from "@/utils/pdfLogo";

type BusinessPlanSummary = Awaited<ReturnType<typeof getBusinessPlanSummary>>;

/** Même correction que l'export PDF facturation : évite le glyphe de substitution
 * de l'espace fine insécable de Intl.NumberFormat('fr-FR'), absente de WinAnsi. */
function formatAmount(value: number, currency: string): string {
  const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })
    .format(value)
    .replace(/[\u202F\u00A0]/g, " ");
  return `${formatted} ${currency}`;
}

/** Même formatage sans le suffixe devise — pour les tableaux à colonnes très
 * étroites (plan de trésorerie mensuel, 12 colonnes sur une largeur A4) où
 * répéter la devise dans chaque cellule est à la fois redondant (déjà
 * indiquée dans le contexte) et suffisant à lui seul pour faire déborder le
 * texte sur plusieurs lignes dans une colonne de ~34pt. */
function formatAmountCompact(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(value)
    .replace(/[\u202F\u00A0]/g, " ");
}

/**
 * Les messages du moteur (profitabilité, santé financière) utilisent des emojis
 * (✅❌⚠️) — parfaitement affichés à l'écran, mais absents de l'encodage WinAnsi
 * des polices standard de pdfkit (même classe de problème que l'espace fine
 * insécable des montants). On les remplace par un équivalent textuel uniquement
 * au moment du rendu PDF, sans toucher aux messages eux-mêmes (l'écran ne change pas).
 */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/✅/g, "[OK]")
    .replace(/❌/g, "[X]")
    .replace(/⚠️|⚠/g, "[!]")
    .replace(/🔴/g, "[CRITIQUE]")
    .replace(/🟡/g, "[ALERTE]")
    .replace(/🟢/g, "[OK]");
}

const NARRATIVE_FIELDS: { key: string; label: string }[] = [
  { key: "presentation", label: "Présentation du projet" },
  { key: "executiveSummary", label: "Synthèse / Executive summary" },
  { key: "organisation", label: "Organisation de l'entreprise" },
  { key: "marketStudy", label: "Étude de marché" },
  { key: "pestel", label: "Analyse PESTEL" },
  { key: "swot", label: "Analyse SWOT" },
  { key: "competitors", label: "Analyse concurrentielle" },
  { key: "targetClients", label: "Clients et cibles" },
  { key: "offerPricing", label: "Offre et tarification" },
  { key: "strategy", label: "Stratégie et communication" },
];

const PL_ROW_LABELS: { key: string; label: string; bold?: boolean }[] = [
  { key: "chiffreAffaires", label: "Chiffre d'affaires", bold: true },
  { key: "chargesVariables", label: "Charges variables" },
  { key: "margeBrute", label: "Marge brute", bold: true },
  { key: "chargesFixes", label: "Charges fixes" },
  { key: "chargesPersonnel", label: "Charges de personnel" },
  {
    key: "excedentBrutExploitation",
    label: "Excédent brut d'exploitation",
    bold: true,
  },
  { key: "impotsTaxes", label: "Impôts et taxes" },
  { key: "chargesFinancieres", label: "Charges financières" },
  { key: "resultatAvantImpots", label: "Résultat avant impôts", bold: true },
  { key: "impotSocietes", label: "Impôt sur les sociétés" },
  { key: "resultatNet", label: "Résultat net", bold: true },
];

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
 * Ligne "libellé (gauche, avec retour à la ligne si besoin) — montant (aligné à
 * la marge droite)". IMPORTANT : pdfkit n'aligne PAS correctement un second appel
 * `.text()` chaîné en `continued: true` pour une mise en page en colonnes — le
 * montant colle juste après le libellé au lieu de rejoindre la marge droite
 * (vérifié empiriquement). La seule façon fiable est un positionnement explicite
 * (x, y) par cellule, avec avancement manuel de `pdf.y` basé sur la hauteur
 * réellement occupée par le libellé (gère le retour à la ligne).
 */
function labelAmountRow(
  pdf: PDFKit.PDFDocument,
  label: string,
  amount: string,
  bold = false,
) {
  const labelWidth = 350;
  const amountX = 400;
  const amountWidth = 145;
  const startY = pdf.y;
  const font = bold ? "Helvetica-Bold" : "Helvetica";
  pdf.font(font).fontSize(9);
  const labelHeight = pdf.heightOfString(label, { width: labelWidth });
  pdf.text(label, 50, startY, { width: labelWidth });
  pdf.text(amount, amountX, startY, { width: amountWidth, align: "right" });
  pdf.x = 50;
  pdf.y = startY + Math.max(labelHeight, 12);
}

export interface BusinessPlanPdfData {
  plan: {
    title: string;
    status: string;
    horizonYears: number;
    narrativeSections: Record<string, string> | null;
  };
  company: { name: string; currency: string; logoUrl?: string | null };
  investments: { category: string; description: string; amount: number }[];
  fundings: { type: string; detail: string; amount: number }[];
  suppliers: { name: string; supplyType: string; annualAmount: number }[];
  hasCashflowLines: boolean;
  summary: BusinessPlanSummary;
}

/**
 * Rendu PUR du business plan dans un PDFDocument déjà créé — aucun accès base de
 * données ici (voir pdf.service.ts pour la récupération des données et le
 * streaming HTTP). Séparation délibérée : permet de tester la mise en page
 * (colonnes, pagination) avec des données fabriquées, sans base réelle.
 */
export function renderBusinessPlanPdf(
  pdf: PDFKit.PDFDocument,
  data: BusinessPlanPdfData,
): void {
  const {
    plan,
    company,
    investments,
    fundings,
    suppliers,
    hasCashflowLines,
    summary,
  } = data;
  const currency = company.currency;

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
  pdf.font("Helvetica-Bold").fontSize(22).text(plan.title, { align: "center" });
  pdf.moveDown(0.3);
  pdf
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#555")
    .text("Business Plan", { align: "center" });
  pdf.moveDown(1.5);
  pdf.fontSize(10).fillColor("#000");
  pdf.text(`Entreprise : ${company.name}`, { align: "center" });
  pdf.text(`Statut : ${plan.status}`, { align: "center" });
  pdf.text(`Horizon : ${plan.horizonYears} an(s)`, { align: "center" });
  pdf.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, {
    align: "center",
  });

  // ---------- Sections narratives ----------
  pdf.addPage();
  sectionTitle(pdf, "Présentation & analyse");
  const narrative = plan.narrativeSections ?? {};
  for (const field of NARRATIVE_FIELDS) {
    ensureSpace(pdf, 60);
    pdf.font("Helvetica-Bold").fontSize(12).fillColor("#000").text(field.label);
    pdf.moveDown(0.2);
    renderHtml(pdf, narrative[field.key]);
    pdf.moveDown(0.6);
  }

  // ---------- Investissement & financement ----------
  pdf.addPage();
  sectionTitle(pdf, "Investissement de départ & financement");

  pdf.font("Helvetica-Bold").fontSize(11).text("Besoins");
  pdf.moveDown(0.2);
  for (const inv of investments) {
    ensureSpace(pdf, 20);
    labelAmountRow(
      pdf,
      `${inv.category} — ${inv.description}`,
      formatAmount(inv.amount, currency),
    );
  }
  pdf.moveDown(0.3);
  labelAmountRow(
    pdf,
    "Total besoins",
    formatAmount(summary.investmentFunding.totalInvestment, currency),
    true,
  );

  pdf.moveDown(0.8);
  pdf.font("Helvetica-Bold").fontSize(11).text("Ressources");
  pdf.moveDown(0.2);
  for (const f of fundings) {
    ensureSpace(pdf, 20);
    labelAmountRow(
      pdf,
      `${f.type} — ${f.detail}`,
      formatAmount(f.amount, currency),
    );
  }
  pdf.moveDown(0.3);
  labelAmountRow(
    pdf,
    "Total ressources",
    formatAmount(summary.investmentFunding.totalFunding, currency),
    true,
  );

  pdf.moveDown(0.5);
  pdf
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(
      sanitizeForPdf(
        `Solde : ${formatAmount(summary.investmentFunding.balance, currency)} — ${summary.investmentFunding.isFullyFunded ? "Financement suffisant ✅" : "Financement insuffisant ⚠️"}`,
      ),
    );

  if (suppliers.length > 0) {
    pdf.moveDown(0.8);
    pdf.font("Helvetica-Bold").fontSize(11).text("Fournisseurs pressentis");
    pdf.moveDown(0.2);
    for (const s of suppliers) {
      ensureSpace(pdf, 20);
      labelAmountRow(
        pdf,
        `${s.name} — ${s.supplyType}`,
        formatAmount(s.annualAmount, currency),
      );
    }
  }

  // ---------- Compte de résultat prévisionnel ----------
  pdf.addPage();
  sectionTitle(pdf, "Compte de résultat prévisionnel");
  const years = Object.keys(summary.profitLoss.byYear)
    .map(Number)
    .sort((a, b) => a - b);
  const plLabelWidth = 180;
  const plDataWidth = (495 - plLabelWidth) / years.length;
  const plColX = (i: number) => 50 + plLabelWidth + i * plDataWidth;

  let rowY = pdf.y;
  pdf.font("Helvetica-Bold").fontSize(9);
  years.forEach((y, i) =>
    pdf.text(`Année ${y}`, plColX(i), rowY, {
      width: plDataWidth,
      align: "right",
    }),
  );
  rowY += 14;
  pdf
    .moveTo(50, rowY - 2)
    .lineTo(545, rowY - 2)
    .strokeColor("#ccc")
    .stroke();

  const plBottom = pdf.page.height - pdf.page.margins.bottom;
  for (const row of PL_ROW_LABELS) {
    if (rowY + 16 > plBottom) {
      pdf.addPage();
      rowY = pdf.page.margins.top;
    }
    pdf.font(row.bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    pdf.text(row.label, 50, rowY, { width: plLabelWidth });
    years.forEach((y, i) => {
      const value = (
        summary.profitLoss.byYear[String(y)] as unknown as Record<
          string,
          number
        >
      )[row.key];
      pdf.text(formatAmount(value ?? 0, currency), plColX(i), rowY, {
        width: plDataWidth,
        align: "right",
      });
    });
    rowY += 15;
  }
  pdf.x = 50;
  pdf.y = rowY;
  pdf.moveDown(0.6);
  pdf
    .font("Helvetica-Oblique")
    .fontSize(9)
    .text(sanitizeForPdf(summary.profitLoss.profitabilityMessage));

  // ---------- Plan de trésorerie (année 1) ----------
  pdf.addPage();
  sectionTitle(pdf, "Plan de trésorerie — Année 1");
  pdf
    .font("Helvetica-Oblique")
    .fontSize(7)
    .fillColor("#999")
    .text(`Montants en ${currency}`);
  pdf.fillColor("#000");
  pdf.moveDown(0.3);
  const monthLabels = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];

  const mLabelWidth = 65;
  const mDataWidth = (495 - mLabelWidth) / 12;
  const mColX = (i: number) => 50 + mLabelWidth + i * mDataWidth;

  let mRowY = pdf.y;
  pdf.font("Helvetica-Bold").fontSize(7);
  monthLabels.forEach((m, i) =>
    pdf.text(m, mColX(i), mRowY, { width: mDataWidth, align: "right" }),
  );
  mRowY += 12;
  pdf
    .moveTo(50, mRowY - 2)
    .lineTo(545, mRowY - 2)
    .strokeColor("#ccc")
    .stroke();

  const cashRows: {
    label: string;
    key: "inflow" | "outflow" | "closingBalance";
    bold?: boolean;
  }[] = [
    { label: "Encaissements", key: "inflow" },
    { label: "Décaissements", key: "outflow" },
    { label: "Solde cumulé", key: "closingBalance", bold: true },
  ];
  for (const row of cashRows) {
    pdf.font(row.bold ? "Helvetica-Bold" : "Helvetica").fontSize(7);
    pdf.text(row.label, 50, mRowY, { width: mLabelWidth });

    let maxCellHeight = pdf.heightOfString(row.label, { width: mLabelWidth });
    summary.cashflow.schedule.forEach((m, i) => {
      const text = formatAmountCompact(m[row.key]);
      const cellHeight = pdf.heightOfString(text, { width: mDataWidth });
      maxCellHeight = Math.max(maxCellHeight, cellHeight);
      pdf.text(text, mColX(i), mRowY, { width: mDataWidth, align: "right" });
    });
    mRowY += Math.max(maxCellHeight, 9) + 4;
  }
  pdf.x = 50;
  pdf.y = mRowY;
  pdf.moveDown(0.6);
  pdf
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      `Trésorerie en fin d'année 1 : ${formatAmount(summary.cashflow.totalYearEnd, currency)}`,
    );

  if (!hasCashflowLines) {
    pdf.moveDown(0.4);
    pdf
      .font("Helvetica-Oblique")
      .fontSize(9)
      .fillColor("#999")
      .text("Aucune écriture de trésorerie saisie.");
    pdf.fillColor("#000");
  }

  // ---------- Bilan prévisionnel & indicateurs ----------
  pdf.addPage();
  sectionTitle(pdf, "Bilan prévisionnel & indicateurs financiers");
  for (const y of years) {
    ensureSpace(pdf, 90);
    const b = summary.balance.byYear[String(y)];
    if (!b) continue;
    pdf.font("Helvetica-Bold").fontSize(11).text(`Année ${y}`);
    pdf.moveDown(0.2);
    pdf.font("Helvetica").fontSize(9);
    pdf.text(
      sanitizeForPdf(
        `Total actif : ${formatAmount(b.totalActif, currency)}    Total passif : ${formatAmount(b.totalPassif, currency)}    ${b.isEquilibre ? "✅ Équilibré" : "⚠️ Non équilibré"}`,
      ),
    );
    pdf.text(
      `BFR : ${formatAmount(b.bfr, currency)}    Trésorerie nette : ${formatAmount(b.tresorerieNette, currency)}`,
    );
    pdf.text(
      `Taux d'endettement : ${b.tauxEndettement !== null ? `${(b.tauxEndettement * 100).toFixed(0)}%` : "—"}    Autonomie financière : ${b.autonomieFinanciere !== null ? `${(b.autonomieFinanciere * 100).toFixed(0)}%` : "—"}`,
    );
    pdf.moveDown(0.6);
  }
  pdf
    .font("Helvetica-Oblique")
    .fontSize(9)
    .text(sanitizeForPdf(summary.balance.healthAppreciation.message), {
      width: 495,
    });

  // ---------- Pagination ----------
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
