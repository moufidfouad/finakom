import PDFDocument from "pdfkit";
import { Response } from "express";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedAnalysisOrThrow } from "@/modules/analyses/analyses.service";
import { getFullReport } from "@/modules/engine/results.service";
import { renderFinancialStatementsPdf } from "./render";

/** Récupère les données et diffuse le PDF en réponse HTTP — le rendu lui-même
 * (mise en page, pagination) vit dans render.ts, pur et testable sans base. */
export async function streamFinancialStatementsPdf(
  analysisId: string,
  auth: AuthenticatedUser,
  res: Response,
) {
  const analysis = await getOwnedAnalysisOrThrow(analysisId, auth);
  const report = await getFullReport(analysisId, auth);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${analysis.label.replace(/[^\w\- ]/g, "")}.pdf"`,
  );

  const pdf = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
  pdf.pipe(res);

  renderFinancialStatementsPdf(pdf, {
    analysis: {
      label: analysis.label,
      exerciceNDate: analysis.exerciceNDate,
      exerciceN1Date: analysis.exerciceN1Date,
      analystName: analysis.analystName,
    },
    company: {
      name: analysis.company.name,
      currency: analysis.company.currency,
      logoUrl: analysis.company.logoUrl,
    },
    report,
  });

  pdf.end();
}
