import { Response } from "express";

/** Envoie une chaîne CSV déjà construite (voir csvExport.ts) en réponse HTTP,
 * avec les en-têtes appropriés pour un téléchargement direct nommé. */
export function sendCsv(res: Response, filename: string, csv: string): void {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csv);
}
