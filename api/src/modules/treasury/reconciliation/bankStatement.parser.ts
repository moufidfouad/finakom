import * as XLSX from "xlsx";
import { AppError } from "@/utils/AppError";

export interface ParsedStatementLine {
  date: Date;
  label: string;
  amount: number; // signé : positif = crédit, négatif = débit
  reference?: string;
}

/**
 * Parse un relevé bancaire CSV/Excel — colonnes attendues : Date, Libellé,
 * Montant (signé : positif pour un crédit, négatif pour un débit), Référence
 * (optionnelle). Même approche que balance.parser.ts (xlsx/SheetJS gère CSV et
 * Excel indifféremment), en-tête détecté automatiquement (première cellule non
 * numérique = ligne d'en-tête à ignorer).
 */
export function parseBankStatementFile(
  buffer: Buffer,
  originalName: string,
): ParsedStatementLine[] {
  // Un CSV brut sans BOM fait dépendre XLSX.read({type:'buffer'}) de sa propre
  // détection heuristique d'encodage, qui interprète parfois du texte UTF-8
  // valide comme du Latin-1 (accents français corrompus en mojibake, ex:
  // "Chèque" -> "ChÃ¨que") — vérifié empiriquement. On décode nous-mêmes en
  // UTF-8 et on passe une chaîne déjà décodée, pour ne plus dépendre de cette
  // heuristique. Les fichiers .xlsx (binaires, pas du texte) ne sont pas concernés
  // par ce problème et continuent d'être lus tels quels.
  const isLikelyXlsx =
    originalName.toLowerCase().endsWith(".xlsx") ||
    originalName.toLowerCase().endsWith(".xls");
  const workbook = isLikelyXlsx
    ? XLSX.read(buffer, { type: "buffer" })
    : XLSX.read(buffer.toString("utf8"), { type: "string" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw AppError.badRequest(
      "Le fichier ne contient aucune feuille exploitable",
    );
  }

  const sheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
  });

  if (rows.length === 0) {
    throw AppError.badRequest("Le fichier est vide");
  }

  const firstCell = String(rows[0]?.[0] ?? "").trim();
  const looksLikeDate =
    /^\d{4}-\d{2}-\d{2}$/.test(firstCell) ||
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(firstCell) ||
    !isNaN(Number(firstCell));
  const dataRows = looksLikeDate ? rows : rows.slice(1);

  const lines: ParsedStatementLine[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, idx) => {
    const [rawDate, label, rawAmount, reference] = row;
    if (rawDate === undefined || rawDate === "") return;

    const date = parseDate(rawDate);
    const amount = Number(rawAmount);

    if (!date || isNaN(date.getTime())) {
      errors.push(`Ligne ${idx + 1} : date invalide ("${rawDate}")`);
      return;
    }
    if (isNaN(amount) || amount === 0) {
      errors.push(`Ligne ${idx + 1} : montant invalide ("${rawAmount}")`);
      return;
    }
    if (!label || String(label).trim() === "") {
      errors.push(`Ligne ${idx + 1} : libellé manquant`);
      return;
    }

    lines.push({
      date,
      label: String(label).trim(),
      amount,
      reference: reference ? String(reference).trim() : undefined,
    });
  });

  if (errors.length > 0) {
    throw AppError.badRequest(
      `Fichier "${originalName}" invalide :\n${errors.slice(0, 10).join("\n")}${errors.length > 10 ? `\n... et ${errors.length - 10} autre(s) erreur(s)` : ""}`,
    );
  }
  if (lines.length === 0) {
    throw AppError.badRequest(
      "Aucune ligne exploitable trouvée dans le fichier.",
    );
  }

  return lines;
}

function parseDate(raw: unknown): Date | null {
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") {
    // Numéro de série Excel (jours depuis 1899-12-30)
    return new Date(Date.UTC(1899, 11, 30) + raw * 24 * 60 * 60 * 1000);
  }
  const parsed = new Date(String(raw));
  return isNaN(parsed.getTime()) ? null : parsed;
}
