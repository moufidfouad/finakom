import PDFDocument from "pdfkit";
import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import {
  assertCanModifyDocument,
  getDocument,
  getOwnedDocumentOrThrow,
} from "@/modules/invoicing/documents/documents.service";
import { getOrCreateSettings } from "@/modules/invoicing/settings/settings.service";
import { drawCompanyLogo } from "@/utils/pdfLogo";

/**
 * `Intl.NumberFormat('fr-FR')` sépare les milliers avec une espace fine insécable
 * (U+202F). Les polices standard de pdfkit (Helvetica...) sont limitées à
 * l'encodage WinAnsi, qui ne contient pas ce caractère — il s'affichait donc
 * comme un glyphe de substitution (une barre). On le remplace par une espace
 * ASCII normale, présente dans WinAnsi.
 */
function formatAmount(value: number, currency: string): string {
  const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })
    .format(value)
    .replace(/[\u202F\u00A0]/g, " ");
  return `${formatted} ${currency}`;
}

/**
 * Génère le PDF d'un document commercial et l'écrit directement dans la réponse
 * HTTP (streaming, pas de fichier temporaire sur disque). Réservé au créateur du
 * document, à l'administrateur de l'entreprise, ou au SUPERADMIN — même règle
 * que pour la modification, l'export PDF n'est pas un simple accès en lecture.
 */
export async function streamDocumentPdf(
  documentId: string,
  auth: AuthenticatedUser,
  res: Response,
) {
  const raw = await getOwnedDocumentOrThrow(documentId, auth);
  await assertCanModifyDocument(raw, auth);

  const doc = await getDocument(documentId, auth);
  const settings = await getOrCreateSettings(doc.companyId);
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: doc.companyId },
    select: {
      name: true,
      country: true,
      sector: true,
      fiscalRegime: true,
      currency: true,
      logoUrl: true,
      address: true,
    },
  });
  const currency = company.currency;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${doc.number}.pdf"`);

  const pdf = new PDFDocument({ margin: 50, size: "A4" });
  pdf.pipe(res);

  // Logo en haut à droite (n'affecte pas le positionnement du titre à gauche)
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

  // Émetteur (entreprise) & Client, côte à côte — chaque bloc gère son propre curseur Y
  const infoTop = pdf.y;

  pdf
    .fillColor("#000")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Émetteur", 50, infoTop);
  pdf
    .font("Helvetica")
    .fontSize(10)
    .text(company.name, 50, infoTop + 16, { width: 260 });
  let emitterY = pdf.y;
  if (company.address) {
    pdf.text(company.address, 50, emitterY, { width: 260 });
    emitterY = pdf.y;
  }
  if (company.sector) {
    pdf.text(company.sector, 50, emitterY, { width: 260 });
    emitterY = pdf.y;
  }
  pdf.text(company.country, 50, emitterY, { width: 260 });
  emitterY = pdf.y;
  if (company.fiscalRegime) {
    pdf.text(`Régime fiscal : ${company.fiscalRegime}`, 50, emitterY, {
      width: 260,
    });
    emitterY = pdf.y;
  }
  if (settings.vatMention) {
    pdf.text(settings.vatMention, 50, emitterY, { width: 260 });
    emitterY = pdf.y;
  }

  pdf.font("Helvetica-Bold").fontSize(11).text("Client", 320, infoTop);
  pdf
    .font("Helvetica")
    .fontSize(10)
    .text(doc.client.name, 320, infoTop + 16, { width: 225 });
  let clientY = pdf.y;
  if (doc.client.address) {
    pdf.text(doc.client.address, 320, clientY, { width: 225 });
    clientY = pdf.y;
  }
  if (doc.client.phone) {
    pdf.text(doc.client.phone, 320, clientY, { width: 225 });
    clientY = pdf.y;
  }
  if (doc.client.email) {
    pdf.text(doc.client.email, 320, clientY, { width: 225 });
    clientY = pdf.y;
  }

  const dateRowY = Math.max(emitterY, clientY) + 10;
  pdf.font("Helvetica-Bold").fontSize(11).text("Date", 50, dateRowY);
  pdf
    .font("Helvetica")
    .fontSize(10)
    .text(new Date(doc.date).toLocaleDateString("fr-FR"), 50, dateRowY + 14);
  if (doc.createdBy) {
    pdf.font("Helvetica-Bold").fontSize(11).text("Établi par", 320, dateRowY);
    pdf
      .font("Helvetica")
      .fontSize(10)
      .text(doc.createdBy.fullName || doc.createdBy.email, 320, dateRowY + 14);
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
    const lineTotal = Number(line.quantity) * Number(line.unitPriceHT);
    pdf.text(line.designation, col.designation, y, { width: 260 });
    pdf.text(String(line.quantity), col.qty, y);
    pdf.text(formatAmount(Number(line.unitPriceHT), currency), col.pu, y);
    pdf.text(formatAmount(lineTotal, currency), col.total, y);
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
    .text(formatAmount(doc.totals.totalHT, currency), col.total, y);
  y += 16;
  pdf
    .text(`TVA (${Number(doc.tvaRatePercent)}%)`, 390, y)
    .text(formatAmount(doc.totals.totalTVA, currency), col.total, y);
  y += 16;
  pdf
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Total TTC", 390, y)
    .text(formatAmount(doc.totals.totalTTC, currency), col.total, y, {
      width: 100,
    });

  if (doc.paymentSummary) {
    y += 26;
    pdf
      .font("Helvetica")
      .fontSize(10)
      .text("Payé", 390, y)
      .text(formatAmount(doc.paymentSummary.totalPaid, currency), col.total, y);
    y += 16;
    pdf
      .font("Helvetica-Bold")
      .text("Reste dû", 390, y)
      .text(formatAmount(doc.paymentSummary.remaining, currency), col.total, y);
  }

  // Mentions légales
  pdf.moveDown(4);
  pdf.font("Helvetica").fontSize(8).fillColor("#777");
  if (settings.paymentConditions)
    pdf.text(`Conditions de paiement : ${settings.paymentConditions}`);
  if (settings.legalMention) pdf.text(settings.legalMention);
  if (settings.bankDetails) pdf.text(settings.bankDetails);

  pdf.end();
}
