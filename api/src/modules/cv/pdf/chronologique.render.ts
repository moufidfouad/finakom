import { CvForPdf } from "./cvPdf.types";

const AMBER = "#D98C2B";
const NAVY = "#16233F";
const TIMELINE_X = 62;
const CONTENT_X = 85;
const CONTENT_WIDTH = 470;

function formatYear(date: Date | null): string {
  return date ? new Date(date).getFullYear().toString() : "aujourd'hui";
}

/**
 * Ligne verticale continue avec un point à chaque expérience et formation —
 * valorise la progression de carrière comme un récit visuel, plutôt qu'une
 * simple liste. Dessinée segment par segment entre chaque point plutôt qu'en
 * une seule fois : la hauteur totale dépend du contenu (variable), inutile
 * de la précalculer en une passe séparée.
 */
export function renderChronologiqueTemplate(
  pdf: PDFKit.PDFDocument,
  cv: CvForPdf,
): void {
  pdf.rect(0, 0, 612, 90).fill(NAVY);
  pdf
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#fff")
    .text(cv.candidate.fullName, 50, 26);
  pdf
    .font("Helvetica-Oblique")
    .fontSize(12)
    .fillColor(AMBER)
    .text(cv.title, 50, 52);
  const contactParts = [cv.candidate.email, cv.candidate.phone].filter(Boolean);
  if (contactParts.length) {
    pdf
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#ccc")
      .text(contactParts.join("  ·  "), 50, 70);
  }

  let y = 112;

  if (cv.summary) {
    pdf
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor("#333")
      .text(cv.summary, 50, y, { width: 510 });
    y = pdf.y + 18;
  }

  function timelinePoint(atY: number) {
    pdf.circle(TIMELINE_X, atY + 4, 4).fill(AMBER);
  }

  function timelineSegment(fromY: number, toY: number) {
    if (toY <= fromY) return;
    pdf
      .moveTo(TIMELINE_X, fromY)
      .lineTo(TIMELINE_X, toY)
      .strokeColor("#ccc")
      .lineWidth(2)
      .stroke();
  }

  if (cv.experiences.length || cv.educations.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(NAVY)
      .text("Parcours", CONTENT_X, y);
    y = pdf.y + 14;

    // Fusionne expériences et formations en une seule chronologie, triée par
    // date décroissante — un vrai parcours ne sépare pas artificiellement
    // "travail" et "études" quand l'idée est de montrer une progression.
    type Entry = { sortDate: number; render: (atY: number) => number };
    const entries: Entry[] = [
      ...cv.experiences.map((exp) => ({
        sortDate: new Date(exp.startDate).getTime(),
        render: (atY: number) => {
          pdf
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#111")
            .text(exp.title, CONTENT_X, atY, { width: CONTENT_WIDTH });
          pdf
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#666")
            .text(
              `${exp.company}  ·  ${formatYear(exp.startDate)} – ${formatYear(exp.endDate)}`,
              CONTENT_X,
              pdf.y + 1,
            );
          if (exp.description)
            pdf
              .font("Helvetica")
              .fontSize(8.5)
              .fillColor("#333")
              .text(exp.description, CONTENT_X, pdf.y + 3, {
                width: CONTENT_WIDTH,
              });
          return pdf.y;
        },
      })),
      ...cv.educations.map((edu) => ({
        sortDate: new Date(edu.startYear, 0).getTime(),
        render: (atY: number) => {
          pdf
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#111")
            .text(edu.degree, CONTENT_X, atY, { width: CONTENT_WIDTH });
          pdf
            .font("Helvetica")
            .fontSize(9)
            .fillColor("#666")
            .text(
              `${edu.school}  ·  ${edu.startYear} – ${edu.endYear ?? "en cours"}`,
              CONTENT_X,
              pdf.y + 1,
            );
          return pdf.y;
        },
      })),
    ].sort((a, b) => b.sortDate - a.sortDate);

    let prevY: number | null = null;
    for (const entry of entries) {
      if (prevY !== null) timelineSegment(prevY + 8, y + 4);
      timelinePoint(y);
      y = entry.render(y) + 14;
      prevY = y - 14;
    }
    y += 6;
  }

  if (cv.skills.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(NAVY)
      .text("Compétences", CONTENT_X, y);
    y = pdf.y + 8;
    for (const skill of cv.skills) {
      const line = skill.specificities.length
        ? `${skill.title} (${skill.level}) — ${skill.specificities.join(", ")}`
        : `${skill.title} (${skill.level})`;
      pdf
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#333")
        .text(line, CONTENT_X, y, { width: CONTENT_WIDTH });
      y = pdf.y + 3;
    }
    y += 6;
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
      .fontSize(8.5)
      .fillColor("#666")
      .text(tags.join("\n"), CONTENT_X, y, { width: CONTENT_WIDTH });
  }
}
