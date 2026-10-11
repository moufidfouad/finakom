import { CvForPdf } from "./cvPdf.types";

function formatYear(date: Date | null): string {
  return date ? new Date(date).getFullYear().toString() : "aujourd'hui";
}

/**
 * Une colonne, espacement serré, dates alignées à droite du titre plutôt
 * que sur leur propre ligne — pensé pour un candidat avec beaucoup de
 * contenu (plusieurs expériences, formations) qui veut tout faire tenir
 * sur une seule page sans perdre en lisibilité. Différent de "classique",
 * qui privilégie l'espace de respiration plutôt que la densité.
 */
export function renderCompactTemplate(
  pdf: PDFKit.PDFDocument,
  cv: CvForPdf,
): void {
  pdf
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#111")
    .text(cv.candidate.fullName, 40, 36);
  pdf.font("Helvetica").fontSize(10.5).fillColor("#444").text(cv.title, 40, 55);

  const contactParts = [cv.candidate.email, cv.candidate.phone].filter(Boolean);
  if (contactParts.length) {
    pdf.fontSize(8).fillColor("#777").text(contactParts.join("  ·  "), 40, 70);
  }

  pdf
    .moveTo(40, 86)
    .lineTo(555, 86)
    .strokeColor("#ddd")
    .lineWidth(0.5)
    .stroke();
  let y = 96;

  function lineWithRightDate(
    title: string,
    right: string,
    atY: number,
  ): number {
    pdf
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .fillColor("#111")
      .text(title, 40, atY, { width: 400, continued: false });
    pdf
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#888")
      .text(right, 460, atY, { width: 95, align: "right" });
    return pdf.y;
  }

  if (cv.summary) {
    pdf
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#333")
      .text(cv.summary, 40, y, { width: 515 });
    y = pdf.y + 8;
  }

  if (cv.experiences.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(10.5)
      .fillColor("#111")
      .text("EXPÉRIENCES", 40, y, { characterSpacing: 0.5 });
    y = pdf.y + 5;
    for (const exp of cv.experiences) {
      y = lineWithRightDate(
        `${exp.title} — ${exp.company}`,
        `${formatYear(exp.startDate)}–${formatYear(exp.endDate)}`,
        y,
      );
      if (exp.description) {
        pdf
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#555")
          .text(exp.description, 40, y + 1, { width: 515 });
        y = pdf.y;
      }
      y += 6;
    }
    y += 4;
  }

  if (cv.educations.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(10.5)
      .fillColor("#111")
      .text("FORMATIONS", 40, y, { characterSpacing: 0.5 });
    y = pdf.y + 5;
    for (const edu of cv.educations) {
      y =
        lineWithRightDate(
          `${edu.degree} — ${edu.school}`,
          `${edu.startYear}–${edu.endYear ?? "en cours"}`,
          y,
        ) + 6;
    }
    y += 4;
  }

  if (cv.skills.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(10.5)
      .fillColor("#111")
      .text("COMPÉTENCES", 40, y, { characterSpacing: 0.5 });
    y = pdf.y + 5;
    for (const skill of cv.skills) {
      const line = skill.specificities.length
        ? `${skill.title} (${skill.level}) — ${skill.specificities.join(", ")}`
        : `${skill.title} (${skill.level})`;
      pdf
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor("#333")
        .text(line, 40, y, { width: 515 });
      y = pdf.y + 3;
    }
    y += 4;
  }

  const tags: string[] = [];
  if (cv.languages.length)
    tags.push(
      `Langues : ${cv.languages.map((l) => `${l.name} (${l.level})`).join(", ")}`,
    );
  if (cv.permits.length) tags.push(`Permis : ${cv.permits.join(", ")}`);
  if (cv.interests.length)
    tags.push(`Centres d'intérêt : ${cv.interests.join(", ")}`);
  if (tags.length) {
    pdf
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#666")
      .text(tags.join("   |   "), 40, y, { width: 515 });
  }
}
