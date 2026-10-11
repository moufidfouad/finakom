import * as XLSX from "xlsx";
import { AppError } from "@/utils/AppError";
import { BalanceLineInput, balanceLineSchema } from "./balance.schemas";

export function parseBalanceFile(
  buffer: Buffer,
  originalName: string,
): BalanceLineInput[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
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
  const hasHeader = !/^\d+$/.test(firstCell);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const lines: BalanceLineInput[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, idx) => {
    const [accountNumber, label, debitN, creditN, debitN1, creditN1] = row;
    if (accountNumber === undefined || accountNumber === "") return;

    const parsed = balanceLineSchema.safeParse({
      accountNumber: String(accountNumber).trim(),
      label: label ? String(label).trim() : "",
      debitN: debitN ?? 0,
      creditN: creditN ?? 0,
      debitN1: debitN1 ?? 0,
      creditN1: creditN1 ?? 0,
    });

    if (!parsed.success) {
      errors.push(
        `Ligne ${idx + (hasHeader ? 2 : 1)} (${originalName}) : ${parsed.error.issues[0]?.message}`,
      );
      return;
    }
    lines.push(parsed.data);
  });

  if (errors.length > 0) {
    throw AppError.badRequest(
      "Erreurs de format dans le fichier importé",
      errors,
    );
  }
  if (lines.length === 0) {
    throw AppError.badRequest(
      "Aucune ligne de balance valide trouvée dans le fichier",
    );
  }

  return lines;
}
