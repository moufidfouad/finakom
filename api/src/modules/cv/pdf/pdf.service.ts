import PDFDocument from "pdfkit";
import { Response } from "express";
import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { renderClassiqueTemplate } from "./classique.render";
import { renderModerneTemplate } from "./moderne.render";
import { renderCompactTemplate } from "./compact.render";
import { renderChronologiqueTemplate } from "./chronologique.render";
import { renderDeuxColonnesTemplate } from "./deuxColonnes.render";

const CV_PDF_INCLUDE = {
  candidate: {
    select: { fullName: true, phone: true, email: true, photoUrl: true },
  },
  educations: { orderBy: { startYear: "desc" as const } },
  experiences: { orderBy: { startDate: "desc" as const } },
  skills: true,
  languages: true,
};

/**
 * Génère le PDF d'un CV et l'écrit directement dans la réponse HTTP
 * (streaming, cohérent avec streamDocumentPdf côté facturation). Toujours
 * les vraies coordonnées du candidat, jamais les réglages showFullName/
 * showPhoto/showPhone de la version publique en ligne — ce PDF est un
 * export personnel que le candidat envoie lui-même à qui il veut, pas une
 * page consultée par un visiteur anonyme ; les deux contextes ont des
 * règles de confidentialité différentes par nature.
 */
export async function streamCvPdf(
  cvId: string,
  candidateId: string,
  res: Response,
) {
  const cv = await prisma.candidateCv.findFirst({
    where: { id: cvId, candidateId },
    include: CV_PDF_INCLUDE,
  });
  if (!cv) throw AppError.notFound("CV introuvable");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${cv.title.replace(/[^a-z0-9]+/gi, "-")}.pdf"`,
  );

  const pdf = new PDFDocument({ margin: 0, size: "A4" });
  pdf.pipe(res);

  switch (cv.template) {
    case "moderne":
      renderModerneTemplate(pdf, cv);
      break;
    case "compact":
      renderCompactTemplate(pdf, cv);
      break;
    case "chronologique":
      renderChronologiqueTemplate(pdf, cv);
      break;
    case "deux-colonnes":
      renderDeuxColonnesTemplate(pdf, cv);
      break;
    default:
      renderClassiqueTemplate(pdf, cv);
  }

  pdf.end();
}
