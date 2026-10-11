import PDFDocument from "pdfkit";
import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import {
  getOwnedPurchaseDocumentOrThrow,
  assertCanModifyPurchaseDocument,
  getPurchaseDocument,
} from "@/modules/purchasing/documents/purchaseDocuments.service";
import { renderPurchaseDocumentPdf } from "./purchaseDocument.render";

/** Récupère les données et diffuse le PDF en réponse HTTP — le rendu lui-même
 * vit dans purchaseDocument.render.ts, pur et testable sans base. Réservé au
 * créateur du document, à l'administrateur de l'entreprise, ou au SUPERADMIN —
 * même règle que pour la modification (voir invoicing/pdf/pdf.service.ts). */
export async function streamPurchaseDocumentPdf(
  documentId: string,
  auth: AuthenticatedUser,
  res: Response,
) {
  const raw = await getOwnedPurchaseDocumentOrThrow(documentId, auth);
  await assertCanModifyPurchaseDocument(raw, auth);

  const doc = await getPurchaseDocument(documentId, auth);
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: doc.companyId },
    select: {
      name: true,
      country: true,
      sector: true,
      fiscalRegime: true,
      currency: true,
      logoUrl: true,
    },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${doc.number}.pdf"`);

  const pdf = new PDFDocument({ margin: 50, size: "A4" });
  pdf.pipe(res);

  renderPurchaseDocumentPdf(pdf, {
    company,
    document: {
      type: doc.type,
      number: doc.number,
      date: doc.date,
      tvaRatePercent: Number(doc.tvaRatePercent),
      createdBy: doc.createdBy,
      supplier: {
        name: doc.supplier.name,
        address: doc.supplier.address,
        phone: doc.supplier.phone,
        email: doc.supplier.email,
      },
      lines: doc.lines.map((l: (typeof doc.lines)[number]) => ({
        designation: l.designation,
        quantity: Number(l.quantity),
        unitPriceHT: Number(l.unitPriceHT),
      })),
      totals: doc.totals,
      paymentSummary: doc.paymentSummary
        ? {
            totalPaid: doc.paymentSummary.totalPaid,
            remaining: doc.paymentSummary.remaining,
          }
        : null,
    },
  });

  pdf.end();
}
