/**
 * Moteur de calcul des documents commerciaux (Devis, Facture, Bon de livraison).
 * Reproduit fidèlement les formules du classeur Excel (TOTAL HT, TVA, TOTAL TTC).
 */

export interface DocumentLineInput {
  quantity: number;
  unitPriceHT: number;
}

export interface DocumentLineCalc extends DocumentLineInput {
  totalHT: number;
}

export function computeLineTotal(line: DocumentLineInput): DocumentLineCalc {
  return { ...line, totalHT: line.quantity * line.unitPriceHT };
}

export interface DocumentTotals {
  totalHT: number;
  tvaRatePercent: number;
  totalTVA: number;
  totalTTC: number;
}

/** Reproduit G27=SUM(...), G28=G27*tauxTVA, G29=G27+G28 */
export function computeDocumentTotals(
  lines: DocumentLineInput[],
  tvaRatePercent: number,
): DocumentTotals {
  const totalHT = lines.reduce((sum, l) => sum + l.quantity * l.unitPriceHT, 0);
  const totalTVA = totalHT * (tvaRatePercent / 100);
  const totalTTC = totalHT + totalTVA;
  return { totalHT, tvaRatePercent, totalTVA, totalTTC };
}

export interface PaymentSummary {
  totalTTC: number;
  totalPaid: number;
  remaining: number;
  percentPaid: number;
  status: "Payée" | "Partielle" | "Impayée";
}

/** Reproduit les formules de l'onglet PAIEMENTS (reste dû, % payé, statut dérivé). */
export function computePaymentSummary(
  totalTTC: number,
  payments: number[],
): PaymentSummary {
  const totalPaid = payments.reduce((sum, p) => sum + p, 0);
  const remaining = totalTTC - totalPaid;
  const percentPaid = totalTTC > 0 ? totalPaid / totalTTC : 0;
  const status =
    totalPaid >= totalTTC && totalTTC > 0
      ? "Payée"
      : totalPaid > 0
        ? "Partielle"
        : "Impayée";
  return { totalTTC, totalPaid, remaining, percentPaid, status };
}

/** Formate un numéro de document à partir d'un préfixe, d'une année et d'un compteur. */
export function formatDocumentNumber(
  prefix: string,
  year: number,
  sequence: number,
): string {
  return `${prefix}-${year}-${String(sequence).padStart(3, "0")}`;
}

export const DOC_TYPE_PREFIXES: Record<string, string> = {
  Devis: "DEV",
  Facture: "FAC",
  "Bon de livraison": "BL",
  Avoir: "AVR",
};
