import fs from "fs";
import { resolveUploadPath } from "@/config/uploads";

/**
 * Dessine le logo de l'entreprise en en-tête d'un PDF, s'il existe — no-op
 * silencieux sinon (aucun logo n'est pas une erreur). Utilisé par tous les
 * modules d'export (facturation, business plan, états financiers, RH) pour
 * une intégration cohérente, un seul endroit à faire évoluer.
 *
 * Retourne la position Y où le contenu peut reprendre (sous le logo si dessiné,
 * inchangée sinon) — pdfkit ne décale pas automatiquement le curseur après une image.
 */
export function drawCompanyLogo(
  pdf: PDFKit.PDFDocument,
  logoUrl: string | null | undefined,
  options: {
    x?: number;
    y?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {},
): void {
  if (!logoUrl) return;

  const absolutePath = resolveUploadPath(logoUrl);
  if (!fs.existsSync(absolutePath)) return; // fichier référencé en base mais absent du disque : ignore plutôt que planter l'export

  const x = options.x ?? 50;
  const y = options.y ?? 40;
  const maxWidth = options.maxWidth ?? 90;
  const maxHeight = options.maxHeight ?? 50;

  try {
    pdf.image(absolutePath, x, y, { fit: [maxWidth, maxHeight] });
  } catch {
    // Fichier corrompu/format inattendu : on n'interrompt jamais la génération
    // du PDF pour un logo — le document reste utilisable sans lui.
  }
}
