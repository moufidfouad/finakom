import {
  formatAmountForPdf as formatAmount,
  sanitizeForPdf as clean,
} from "@/utils/pdfText";
import { drawCompanyLogo } from "@/utils/pdfLogo";

export interface PurchaseDocumentPdfData {
  company: {
    name: string;
    country: string;
    sector: string | null;
    fiscalRegime: string | null;
    currency: string;
    logoUrl: string | null;
  };
  document: {
    type: string;
    number: string;
    date: Date;
    tvaRatePercent: number;
    createdBy: { fullName: string | null; email: string } | null;
    supplier: {
      name: string;
      address: string | null;
      phone: string | null;
      email: string | null;
    };
    lines: { designation: string; quantity: number; unitPriceHT: number }[];
    totals: { totalHT: number; totalTVA: number; totalTTC: number };
    paymentSummary: { totalPaid: number; remaining: number } | null;
  };
}

/**
 * Rendu PUR du PDF d'un document d'achat (Bon de commande / Facture
 * fournisseur) — aucun accès base de données ici (voir pdf.service.ts). Miroir
 * du PDF facturation existant (invoicing/pdf/pdf.service.ts), avec le
 * fournisseur à la place du client. Positionnement explicite (x, y) pour
 * chaque cellule — jamais de `continued` pour une mise en page en colonnes
 * (source d'un bug déjà rencontré et corrigé sur d'autres modules PDF de cette
 * application).
 */
export function renderPurchaseDocumentPdf(
  pdf: PDFKit.PDFDocument,
  data: PurchaseDocumentPdfData,
): void {
  const { company, document: doc } = data;
  const currency = company.currency;
  const amt = (v: number) => formatAmount(v, currency);

  drawCompanyLogo(pdf, company.logoUrl, {
    x: 450,
    y: 40,
    maxWidth: 95,
    maxHeight: 45,
  });

  // En-tête
  pdf
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(doc.type.toUpperCase(), { align: "left" });
  pdf
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#555")
    .text(doc.number, { align: "left" });
  pdf.moveDown(1.5);

  // Notre entreprise (émettrice du bon de commande, ou destinataire de la facture fournisseur) & Fournisseur
  const infoTop = pdf.y;

  pdf
    .fillColor("#000")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Notre entreprise", 50, infoTop);
  pdf
    .font("Helvetica")
    .fontSize(10)
    .text(clean(company.name), 50, infoTop + 16, { width: 260 });
  let usY = pdf.y;
  if (company.sector) {
    pdf.text(clean(company.sector), 50, usY, { width: 260 });
    usY = pdf.y;
  }
  pdf.text(clean(company.country), 50, usY, { width: 260 });
  usY = pdf.y;
  if (company.fiscalRegime) {
    pdf.text(clean(`Régime fiscal : ${company.fiscalRegime}`), 50, usY, {
      width: 260,
    });
    usY = pdf.y;
  }

  pdf.font("Helvetica-Bold").fontSize(11).text("Fournisseur", 320, infoTop);
  pdf
    .font("Helvetica")
    .fontSize(10)
    .text(clean(doc.supplier.name), 320, infoTop + 16, { width: 225 });
  let supplierY = pdf.y;
  if (doc.supplier.address) {
    pdf.text(clean(doc.supplier.address), 320, supplierY, { width: 225 });
    supplierY = pdf.y;
  }
  if (doc.supplier.phone) {
    pdf.text(clean(doc.supplier.phone), 320, supplierY, { width: 225 });
    supplierY = pdf.y;
  }
  if (doc.supplier.email) {
    pdf.text(clean(doc.supplier.email), 320, supplierY, { width: 225 });
    supplierY = pdf.y;
  }

  const dateRowY = Math.max(usY, supplierY) + 10;
  pdf.font("Helvetica-Bold").fontSize(11).text("Date", 50, dateRowY);
  pdf
    .font("Helvetica")
    .fontSize(10)
    .text(doc.date.toLocaleDateString("fr-FR"), 50, dateRowY + 14);
  if (doc.createdBy) {
    pdf.font("Helvetica-Bold").fontSize(11).text("Établi par", 320, dateRowY);
    pdf
      .font("Helvetica")
      .fontSize(10)
      .text(
        clean(doc.createdBy.fullName || doc.createdBy.email),
        320,
        dateRowY + 14,
      );
  }
  pdf.y = dateRowY + 14;
  pdf.moveDown(3);

  // Tableau des lignes
  const tableTop = pdf.y;
  const col = { designation: 50, qty: 320, pu: 390, total: 470 };
  pdf
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("Désignation", col.designation, tableTop)
    .text("Qté", col.qty, tableTop)
    .text("PU HT", col.pu, tableTop)
    .text("Total HT", col.total, tableTop);
  pdf
    .moveTo(50, tableTop + 15)
    .lineTo(545, tableTop + 15)
    .strokeColor("#ccc")
    .stroke();

  let y = tableTop + 22;
  pdf.font("Helvetica").fontSize(9);
  for (const line of doc.lines) {
    const lineTotal = line.quantity * line.unitPriceHT;
    pdf.text(clean(line.designation), col.designation, y, { width: 260 });
    pdf.text(String(line.quantity), col.qty, y);
    pdf.text(amt(line.unitPriceHT), col.pu, y);
    pdf.text(amt(lineTotal), col.total, y);
    y += 20;
  }
  pdf
    .moveTo(50, y + 5)
    .lineTo(545, y + 5)
    .strokeColor("#ccc")
    .stroke();

  // Totaux
  y += 20;
  pdf
    .font("Helvetica")
    .fontSize(10)
    .text("Total HT", 390, y)
    .text(amt(doc.totals.totalHT), col.total, y);
  y += 16;
  pdf
    .text(`TVA (${doc.tvaRatePercent}%)`, 390, y)
    .text(amt(doc.totals.totalTVA), col.total, y);
  y += 16;
  pdf
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Total TTC", 390, y)
    .text(amt(doc.totals.totalTTC), col.total, y, { width: 100 });

  if (doc.paymentSummary) {
    y += 26;
    pdf
      .font("Helvetica")
      .fontSize(10)
      .text("Réglé", 390, y)
      .text(amt(doc.paymentSummary.totalPaid), col.total, y);
    y += 16;
    pdf
      .font("Helvetica-Bold")
      .text("Reste dû", 390, y)
      .text(amt(doc.paymentSummary.remaining), col.total, y);
  }
}
