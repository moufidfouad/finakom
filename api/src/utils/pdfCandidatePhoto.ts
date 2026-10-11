import fs from "fs";
import { resolveUploadPath } from "@/config/uploads";

/**
 * Dessine une photo de candidat découpée en cercle — distinct de
 * drawCompanyLogo (rectangulaire, utilisé par les documents commerciaux) :
 * un CV présente un portrait, jamais un logo d'entreprise, la convention
 * visuelle est différente. No-op silencieux si absente, fichier manquant ou
 * corrompu — jamais interrompre la génération d'un CV pour une photo.
 */
export function drawCandidatePhoto(
  pdf: PDFKit.PDFDocument,
  photoUrl: string | null | undefined,
  options: { x: number; y: number; diameter: number },
): void {
  if (!photoUrl) return;

  const absolutePath = resolveUploadPath(photoUrl);
  if (!fs.existsSync(absolutePath)) return;

  const { x, y, diameter } = options;
  const radius = diameter / 2;

  try {
    pdf.save();
    pdf.circle(x + radius, y + radius, radius).clip();
    pdf.image(absolutePath, x, y, { width: diameter, height: diameter });
    pdf.restore();
  } catch {
    pdf.restore();
  }
}
