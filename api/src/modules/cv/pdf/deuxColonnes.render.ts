import { drawCandidatePhoto } from "@/utils/pdfCandidatePhoto";
import { CvForPdf } from "./cvPdf.types";

const NAVY = "#16233F";
const AMBER = "#D98C2B";
const LEFT_WIDTH = 175;
const RIGHT_X = LEFT_WIDTH + 40;
const RIGHT_WIDTH = 595 - RIGHT_X - 40;

function formatYear(date: Date | null): string {
  return date ? new Date(date).getFullYear().toString() : "aujourd'hui";
}

/**
 * Même squelette structurel que "moderne" (colonne gauche pour contact/
 * compétences, colonne droite pour le récit professionnel), mais sans le
 * bandeau de fond coloré — juste une fine ligne verticale de séparation.
 * Pour un candidat qui veut la lisibilité d'une structure en deux colonnes
 * sans l'affirmation visuelle forte du bandeau plein, plus neutre à
 * l'impression noir et blanc.
 */
export function renderDeuxColonnesTemplate(
  pdf: PDFKit.PDFDocument,
  cv: CvForPdf,
): void {
  pdf
    .moveTo(LEFT_WIDTH + 20, 40)
    .lineTo(LEFT_WIDTH + 20, 800)
    .strokeColor("#e5e5e5")
    .lineWidth(1)
    .stroke();

  let leftY = 40;
  const photoDiameter = 84;
  drawCandidatePhoto(pdf, cv.candidate.photoUrl, {
    x: (LEFT_WIDTH - photoDiameter) / 2 + 40,
    y: leftY,
    diameter: photoDiameter,
  });
  leftY += photoDiameter + 20;

  const leftX = 40;
  const leftContentWidth = LEFT_WIDTH - 20;

  function leftSection(label: string, atY: number): number {
    pdf
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(NAVY)
      .text(label.toUpperCase(), leftX, atY, { characterSpacing: 0.5 });
    return pdf.y + 7;
  }

  const contactParts = [cv.candidate.email, cv.candidate.phone].filter(Boolean);
  if (contactParts.length) {
    leftY = leftSection("Contact", leftY);
    pdf
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#333")
      .text(contactParts.join("\n"), leftX, leftY, { width: leftContentWidth });
    leftY = pdf.y + 14;
  }

  if (cv.skills.length) {
    leftY = leftSection("Compétences", leftY);
    for (const skill of cv.skills) {
      pdf
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor("#222")
        .text(`${skill.title} (${skill.level})`, leftX, leftY, {
          width: leftContentWidth,
        });
      leftY = pdf.y + 2;
      if (skill.specificities.length) {
        pdf
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor("#888")
          .text(skill.specificities.join(", "), leftX, leftY, {
            width: leftContentWidth,
          });
        leftY = pdf.y + 2;
      }
      leftY += 6;
    }
    leftY += 6;
  }

  if (cv.languages.length) {
    leftY = leftSection("Langues", leftY);
    pdf
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#333")
      .text(
        cv.languages.map((l) => `${l.name} — ${l.level}`).join("\n"),
        leftX,
        leftY,
        { width: leftContentWidth },
      );
    leftY = pdf.y + 14;
  }

  if (cv.permits.length) {
    leftY = leftSection("Permis", leftY);
    pdf
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#333")
      .text(cv.permits.join(", "), leftX, leftY, { width: leftContentWidth });
    leftY = pdf.y + 14;
  }

  if (cv.interests.length) {
    leftY = leftSection("Centres d'intérêt", leftY);
    pdf
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#333")
      .text(cv.interests.join(", "), leftX, leftY, { width: leftContentWidth });
  }

  let y = 40;
  pdf
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(NAVY)
    .text(cv.candidate.fullName, RIGHT_X, y, { width: RIGHT_WIDTH });
  y = pdf.y + 2;
  pdf
    .font("Helvetica-Oblique")
    .fontSize(12)
    .fillColor(AMBER)
    .text(cv.title, RIGHT_X, y, { width: RIGHT_WIDTH });
  y = pdf.y + 14;

  if (cv.summary) {
    pdf
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#333")
      .text(cv.summary, RIGHT_X, y, { width: RIGHT_WIDTH });
    y = pdf.y + 16;
  }

  function rightSection(label: string, atY: number): number {
    pdf
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(NAVY)
      .text(label, RIGHT_X, atY);
    return pdf.y + 8;
  }

  if (cv.experiences.length) {
    y = rightSection("Expériences professionnelles", y);
    for (const exp of cv.experiences) {
      pdf
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#111")
        .text(exp.title, RIGHT_X, y, { width: RIGHT_WIDTH });
      pdf
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#555")
        .text(
          `${exp.company}  ·  ${formatYear(exp.startDate)} – ${formatYear(exp.endDate)}`,
          RIGHT_X,
          pdf.y + 1,
        );
      if (exp.description)
        pdf
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#333")
          .text(exp.description, RIGHT_X, pdf.y + 3, { width: RIGHT_WIDTH });
      y = pdf.y + 12;
    }
    y += 4;
  }

  if (cv.educations.length) {
    y = rightSection("Formations", y);
    for (const edu of cv.educations) {
      pdf
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#111")
        .text(edu.degree, RIGHT_X, y, { width: RIGHT_WIDTH });
      pdf
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#555")
        .text(
          `${edu.school}  ·  ${edu.startYear} – ${edu.endYear ?? "en cours"}`,
          RIGHT_X,
          pdf.y + 1,
        );
      y = pdf.y + 12;
    }
  }
}
