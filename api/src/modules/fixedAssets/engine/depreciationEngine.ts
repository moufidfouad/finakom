/**
 * Moteur de calcul des amortissements — reproduit fidèlement les formules du
 * classeur "Registre des immobilisations" SYSCOHADA Révisé 2017 :
 *  - Taux = 1 / durée
 *  - Amort. cumulés = MIN(brut, brut × taux × MIN(durée, années écoulées au prorata))
 *  - VNC = MAX(0, brut - amort. cumulés)
 *  - Dotation annuelle N :
 *      Linéaire, acquis pendant N  → brut × taux × prorata temporis (jours/365,25)
 *      Linéaire, acquis avant N    → brut × taux (annuité pleine)
 *      Dégressif                   → (brut - amort. cumulés au 31/12/N-1) × taux × coefficient
 *  - Statut : Non amortissable | Amorti (VNC≤0 ou durée atteinte) | Actif
 */

export type DepreciationMethod = "Linéaire" | "Dégressif" | "Non amortissable";
export type AssetStatus = "Actif" | "Amorti" | "Non amortissable";

export interface DepreciationInput {
  grossValue: number;
  acquisitionDate: Date;
  durationYears: number | null;
  method: DepreciationMethod;
  closingDate: Date;
  degressiveCoefficient: number;
}

export interface DepreciationResult {
  rate: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  annualDotation: number;
  status: AssetStatus;
}

const DAYS_PER_YEAR = 365.25;

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24) + 1;
}

function yearsElapsed(acquisitionDate: Date, atDate: Date): number {
  return Math.max(0, daysBetween(acquisitionDate, atDate) / DAYS_PER_YEAR);
}

/** Amortissements cumulés à une date donnée (formule K du registre). */
function accumulatedAt(
  grossValue: number,
  rate: number,
  durationYears: number,
  acquisitionDate: Date,
  atDate: Date,
): number {
  const elapsed = Math.min(
    durationYears,
    Math.max(0, yearsElapsed(acquisitionDate, atDate)),
  );
  return Math.min(grossValue, Math.round(grossValue * rate * elapsed));
}

export function computeDepreciation(
  input: DepreciationInput,
): DepreciationResult {
  const {
    grossValue,
    acquisitionDate,
    durationYears,
    method,
    closingDate,
    degressiveCoefficient,
  } = input;

  if (method === "Non amortissable" || !durationYears) {
    return {
      rate: 0,
      accumulatedDepreciation: 0,
      netBookValue: grossValue,
      annualDotation: 0,
      status: "Non amortissable",
    };
  }

  const rate = 1 / durationYears;
  const accumulatedDepreciation = accumulatedAt(
    grossValue,
    rate,
    durationYears,
    acquisitionDate,
    closingDate,
  );
  const netBookValue = Math.max(0, grossValue - accumulatedDepreciation);

  const fiscalYear = closingDate.getFullYear();
  const yearEnd = new Date(closingDate); // date de clôture = fin d'exercice de référence
  const previousYearEnd = new Date(fiscalYear - 1, 11, 31);

  let annualDotation: number;
  if (method === "Dégressif") {
    const accumulatedAtStart = accumulatedAt(
      grossValue,
      rate,
      durationYears,
      acquisitionDate,
      previousYearEnd,
    );
    const netAtStart = Math.max(0, grossValue - accumulatedAtStart);
    annualDotation = Math.round(netAtStart * rate * degressiveCoefficient);
  } else if (acquisitionDate.getFullYear() === fiscalYear) {
    // Année d'acquisition : prorata temporis (jours de détention / 365,25)
    const daysHeld = Math.max(0, daysBetween(acquisitionDate, yearEnd));
    annualDotation = Math.round(grossValue * rate * (daysHeld / DAYS_PER_YEAR));
  } else {
    annualDotation = Math.round(grossValue * rate);
  }
  // La dotation ne peut pas rendre la VNC négative, ni dépasser ce qui reste à amortir.
  annualDotation = Math.max(0, Math.min(annualDotation, netBookValue));

  const ageYears = yearsElapsed(acquisitionDate, closingDate);
  const status: AssetStatus =
    netBookValue <= 0 || ageYears >= durationYears ? "Amorti" : "Actif";

  return {
    rate,
    accumulatedDepreciation,
    netBookValue,
    annualDotation,
    status,
  };
}
