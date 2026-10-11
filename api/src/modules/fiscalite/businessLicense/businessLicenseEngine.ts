/**
 * Moteur de calcul patente — fonction pure. Formules vérifiées contre le
 * modèle source (TDB FISCALITÉ PME OHADA, onglet PATENTE & LICENCES).
 * Le droit proportionnel dérive du taux configuré dans TaxSettings — le
 * barème par catégorie du modèle source (BUSINESS_LICENSE_BRACKETS
 * ci-dessous) reste une référence informative pour aider l'entreprise à
 * choisir son taux et son droit fixe, jamais une bascule automatique : le
 * modèle source lui-même calcule toujours à partir du taux unique de
 * PARAMETRES, pas d'une correspondance CA→catégorie automatisée.
 */
export interface BusinessLicenseInput {
  annualRevenue: number;
  fixedDuty: number;
}

export interface BusinessLicenseComputed extends BusinessLicenseInput {
  proportionalDuty: number;
  totalDue: number;
  latePenalty: number; // 10% de base + 1,5% par mois de retard
}

export function computeBusinessLicense(
  input: BusinessLicenseInput,
  businessLicenseRate: number,
  monthsLate = 0,
): BusinessLicenseComputed {
  const proportionalDuty = input.annualRevenue * businessLicenseRate;
  const totalDue = proportionalDuty + input.fixedDuty;
  const latePenalty =
    monthsLate > 0 ? totalDue * (0.1 + 0.015 * monthsLate) : 0;

  return { ...input, proportionalDuty, totalDue, latePenalty };
}

/** Barème de référence camerounais — informatif uniquement, voir le
 * commentaire du module. Jamais modifiable par entreprise (contrairement à
 * TaxSettings), c'est un repère légal fixe reproduit tel quel du classeur
 * source. */
export const BUSINESS_LICENSE_BRACKETS = [
  {
    category: "Catégorie A",
    revenueRange: "< 5 000 000",
    fixedDuty: 50000,
    proportionalRate: 0,
    activity: "Commerçant, prestataire local",
  },
  {
    category: "Catégorie B",
    revenueRange: "5M — 20M",
    fixedDuty: 100000,
    proportionalRate: 0.005,
    activity: "PME services, commerce",
  },
  {
    category: "Catégorie C",
    revenueRange: "20M — 100M",
    fixedDuty: 200000,
    proportionalRate: 0.011,
    activity: "PME industrielle, BTP",
  },
  {
    category: "Catégorie D",
    revenueRange: "100M — 500M",
    fixedDuty: 500000,
    proportionalRate: 0.011,
    activity: "Moyenne entreprise",
  },
  {
    category: "Catégorie E",
    revenueRange: "> 500M",
    fixedDuty: 1000000,
    proportionalRate: 0.011,
    activity: "Grande entreprise",
  },
  {
    category: "Professions libérales",
    revenueRange: "Variable",
    fixedDuty: 150000,
    proportionalRate: 0,
    activity: "Médecin, avocat, comptable",
  },
] as const;
