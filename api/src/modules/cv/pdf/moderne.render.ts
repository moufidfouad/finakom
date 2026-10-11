import { drawCandidatePhoto } from "@/utils/pdfCandidatePhoto";
import { CvForPdf } from "./cvPdf.types";

const NAVY = "#16233F";
const AMBER = "#D98C2B";
const SIDEBAR_WIDTH = 190;
const PAGE_WIDTH = 595; // A4 portrait en points

function formatYear(date: Date | null): string {
  return date ? new Date(date).getFullYear().toString() : "aujourd'hui";
}

/**
 * Bandeau latéral + zone principale, inspiré d'une référence graphique
 * fournie par l'utilisateur (photo, coordonnées et compétences à gauche ;
 * identité, expériences et formations à droite). Toujours une seule page :
 * un CV de plusieurs pages perd son effet visuel de gabarit structuré, un
 * candidat qui a trop de contenu pour tenir sur une page devrait plutôt
 * choisir le gabarit classique, pensé pour ce cas.
 */
export function renderModerneTemplate(
  pdf: PDFKit.PDFDocument,
  cv: CvForPdf,
): void {
  // Bandeau latéral
  pdf.rect(0, 0, SIDEBAR_WIDTH, 842).fill("#F1F0EC");

  let sidebarY = 40;
  const photoDiameter = 100;
  drawCandidatePhoto(pdf, cv.candidate.photoUrl, {
    x: (SIDEBAR_WIDTH - photoDiameter) / 2,
    y: sidebarY,
    diameter: photoDiameter,
  });
  sidebarY += photoDiameter + 24;

  pdf
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(NAVY)
    .text("Contact", 24, sidebarY);
  sidebarY = pdf.y + 8;
  pdf.font("Helvetica").fontSize(9).fillColor("#333");
  if (cv.candidate.phone) {
    pdf.text(cv.candidate.phone, 24, sidebarY, { width: SIDEBAR_WIDTH - 48 });
    sidebarY = pdf.y + 4;
  }
  sidebarY += 16;

  if (cv.skills.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(NAVY)
      .text("Compétences", 24, sidebarY);
    sidebarY = pdf.y + 8;
    for (const skill of cv.skills) {
      pdf
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#222")
        .text(skill.title, 24, sidebarY, { width: SIDEBAR_WIDTH - 48 });
      pdf
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#777")
        .text(skill.level, 24, pdf.y + 1);
      sidebarY = pdf.y + 2;
      if (skill.specificities.length) {
        pdf
          .font("Helvetica-Oblique")
          .fontSize(7.5)
          .fillColor("#999")
          .text(skill.specificities.join(", "), 24, sidebarY, {
            width: SIDEBAR_WIDTH - 48,
          });
        sidebarY = pdf.y + 2;
      }
      sidebarY += 8;
    }
    sidebarY += 8;
  }

  if (cv.languages.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(NAVY)
      .text("Langues", 24, sidebarY);
    sidebarY = pdf.y + 8;
    for (const lang of cv.languages) {
      pdf
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#222")
        .text(lang.name, 24, sidebarY, {
          width: SIDEBAR_WIDTH - 48,
          continued: true,
        });
      pdf
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#777")
        .text(`  —  ${lang.level}`);
      sidebarY = pdf.y + 6;
    }
    sidebarY += 8;
  }

  if (cv.permits.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(NAVY)
      .text("Permis", 24, sidebarY);
    sidebarY = pdf.y + 8;
    pdf
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#333")
      .text(cv.permits.join(", "), 24, sidebarY, { width: SIDEBAR_WIDTH - 48 });
    sidebarY = pdf.y + 16;
  }

  if (cv.interests.length) {
    pdf
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(NAVY)
      .text("Centres d'intérêt", 24, sidebarY);
    sidebarY = pdf.y + 8;
    pdf
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#333")
      .text(cv.interests.join(", "), 24, sidebarY, {
        width: SIDEBAR_WIDTH - 48,
      });
  }

  // Zone principale
  const mainX = SIDEBAR_WIDTH + 30;
  const mainWidth = PAGE_WIDTH - mainX - 40;
  let y = 44;

  pdf
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor(NAVY)
    .text(cv.candidate.fullName, mainX, y, { width: mainWidth });
  y = pdf.y + 2;
  pdf
    .font("Helvetica-Oblique")
    .fontSize(13)
    .fillColor(AMBER)
    .text(cv.title, mainX, y, { width: mainWidth });
  y = pdf.y + 16;

  if (cv.summary) {
    pdf
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor("#333")
      .text(cv.summary, mainX, y, { width: mainWidth });
    y = pdf.y + 18;
  }

  function sectionTitle(label: string, atY: number): number {
    pdf
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(NAVY)
      .text(label, mainX, atY);
    const lineY = pdf.y + 4;
    pdf
      .moveTo(mainX, lineY)
      .lineTo(mainX + mainWidth, lineY)
      .strokeColor(AMBER)
      .lineWidth(1.5)
      .stroke();
    return lineY + 12;
  }

  if (cv.experiences.length) {
    y = sectionTitle("Expériences professionnelles", y);
    for (const exp of cv.experiences) {
      pdf
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .fillColor("#111")
        .text(exp.title, mainX, y, { width: mainWidth });
      pdf
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor("#555")
        .text(
          `${exp.company}  ·  ${formatYear(exp.startDate)} – ${formatYear(exp.endDate)}`,
          mainX,
          pdf.y + 1,
        );
      if (exp.description) {
        pdf
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#333")
          .text(exp.description, mainX, pdf.y + 3, { width: mainWidth });
      }
      y = pdf.y + 14;
    }
    y += 4;
  }

  if (cv.educations.length) {
    y = sectionTitle("Formations", y);
    for (const edu of cv.educations) {
      pdf
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .fillColor("#111")
        .text(edu.degree, mainX, y, { width: mainWidth });
      pdf
        .font("Helvetica")
        .fontSize(9.5)
        .fillColor("#555")
        .text(
          `${edu.school}  ·  ${edu.startYear} – ${edu.endYear ?? "en cours"}`,
          mainX,
          pdf.y + 1,
        );
      y = pdf.y + 12;
    }
  }
}
