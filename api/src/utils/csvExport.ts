/**
 * Générateur CSV générique et pur — aucune dépendance externe (pas besoin
 * d'une librairie pour un format aussi simple), utilisé par tous les exports
 * de données brutes de l'application (clients, produits, employés, écritures...).
 *
 * Respecte le format CSV standard (RFC 4180) : séparateur point-virgule
 * (convention française/francophone, plus adaptée qu'une virgule pour un tableur
 * dont les paramètres régionaux utilisent la virgule comme séparateur décimal),
 * champs contenant le séparateur/des guillemets/un retour à la ligne entourés
 * de guillemets doubles avec échappement `""`, BOM UTF-8 en tête pour qu'Excel
 * reconnaisse l'encodage sans qu'il faille l'importer manuellement.
 */

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCsvField(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[;"\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvField(c.header)).join(";");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvField(c.value(row))).join(";"),
  );
  const BOM = "\uFEFF";
  return BOM + [header, ...lines].join("\r\n");
}
