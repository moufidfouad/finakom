import { CvForPdf } from "./cvPdf.types";

function formatYear(date: Date | null): string {
  return date ? new Date(date).getFullYear().toString() : "aujourd'hui";
}

/**
 * Une colonne, sobre, sans photo ni couleur — le gabarit "sûr" pour les
 * candidatures dans des secteurs conservateurs. Cohérent en esprit avec les
 * documents commerciaux déjà générés (facture, contrat) : lisibilité avant
 * tout, aucune fioriture qui pourrait distraire du contenu.
 */
export function renderClassiqueTemplate(
  pdf: PDFKit.PDFDocument,
  cv: CvForPdf,
): void {
  pdf
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#111")
    .text(cv.candidate.fullName, 50, 50);
  pdf.font("Helvetica").fontSize(13).fillColor("#444").text(cv.title, 50, 76);

  const contactParts = [cv.candidate.email, cv.candidate.phone].filter(Boolean);
  if (contactParts.length) {
    pdf.fontSize(9).fillColor("#666").text(contactParts.join("  ·  "), 50, 96);
  }

  pdf
    .moveTo(50, 118)
    .lineTo(545, 118)
    .strokeColor("#ccc")
    .lineWidth(0.5)
    .stroke();
  let y = 132;

  if (cv.summary) {
    pdf
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#333")
      .text(cv.summary, 50, y, { width: 495 });
    y = pdf.y + 16;
  }

  if (cv.experiences.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#111")
      .text("Expériences professionnelles", 50, y);
    y = pdf.y + 8;
    for (const exp of cv.experiences) {
      pdf
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#111")
        .text(`${exp.title} — ${exp.company}`, 50, y, { width: 495 });
      pdf
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#666")
        .text(
          `${formatYear(exp.startDate)} – ${formatYear(exp.endDate)}`,
          50,
          pdf.y + 1,
        );
      if (exp.description) {
        pdf
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#333")
          .text(exp.description, 50, pdf.y + 3, { width: 495 });
      }
      y = pdf.y + 12;
    }
    y += 6;
  }

  if (cv.educations.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#111")
      .text("Formations", 50, y);
    y = pdf.y + 8;
    for (const edu of cv.educations) {
      pdf
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#111")
        .text(`${edu.degree} — ${edu.school}`, 50, y, { width: 495 });
      pdf
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#666")
        .text(`${edu.startYear} – ${edu.endYear ?? "en cours"}`, 50, pdf.y + 1);
      y = pdf.y + 12;
    }
    y += 6;
  }

  if (cv.skills.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#111")
      .text("Compétences", 50, y);
    y = pdf.y + 8;
    for (const skill of cv.skills) {
      pdf
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor("#111")
        .text(`${skill.title} (${skill.level})`, 50, y, { width: 495 });
      y = pdf.y + 1;
      if (skill.specificities.length) {
        pdf
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#666")
          .text(skill.specificities.join("  ·  "), 50, y, { width: 495 });
        y = pdf.y + 2;
      }
      y += 4;
    }
    y += 4;
  }

  if (cv.languages.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#111")
      .text("Langues", 50, y);
    y = pdf.y + 8;
    const languagesLine = cv.languages
      .map((l) => `${l.name} (${l.level})`)
      .join("   ·   ");
    pdf
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#333")
      .text(languagesLine, 50, y, { width: 495 });
    y = pdf.y + 14;
  }

  if (cv.permits.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#111")
      .text("Permis", 50, y);
    y = pdf.y + 8;
    pdf
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#333")
      .text(cv.permits.join("   ·   "), 50, y, { width: 495 });
    y = pdf.y + 14;
  }

  if (cv.interests.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#111")
      .text("Centres d'intérêt", 50, y);
    y = pdf.y + 8;
    pdf
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#333")
      .text(cv.interests.join("   ·   "), 50, y, { width: 495 });
  }
}
