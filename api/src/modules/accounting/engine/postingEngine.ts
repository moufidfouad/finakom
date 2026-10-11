/**
 * Génère les LIGNES d'écriture (montants + rôle de compte requis) pour les
 * événements métier les plus courants — jamais de numéro de compte en dur : le
 * rôle (AccountRole) est résolu vers le compte réel de l'entreprise par le
 * service appelant (chaque entreprise peut avoir un plan comptable différent).
 * Fonctions pures, testées en isolation.
 */

export type AccountRoleName =
  | "CLIENTS"
  | "FOURNISSEURS"
  | "VENTES_MARCHANDISES"
  | "VENTES_SERVICES"
  | "ACHATS"
  | "TVA_COLLECTEE"
  | "TVA_DEDUCTIBLE"
  | "BANQUE"
  | "CAISSE"
  | "CHARGES_PERSONNEL"
  | "PERSONNEL_REMUNERATIONS_DUES"
  | "ORGANISMES_SOCIAUX"
  | "DOTATIONS_AMORTISSEMENTS"
  | "AMORTISSEMENTS_CUMULES";

export interface RoleLine {
  role: AccountRoleName;
  debit: number;
  credit: number;
  label?: string;
}

/**
 * Écriture de vente (facture émise) : 411 Clients au débit pour le TTC,
 * 701/706 Ventes au crédit pour le HT, 4431 TVA collectée au crédit pour la TVA.
 * N'inclut PAS le paiement (voir buildPaymentEntryLines) : une facture émise et
 * son règlement sont deux écritures distinctes, exactement comme deux
 * opérations économiques différentes dans le temps.
 */
export function buildSaleEntryLines(params: {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  isService?: boolean;
}): RoleLine[] {
  const salesRole: AccountRoleName = params.isService
    ? "VENTES_SERVICES"
    : "VENTES_MARCHANDISES";
  const lines: RoleLine[] = [
    { role: "CLIENTS", debit: params.totalTTC, credit: 0 },
  ];
  if (params.totalHT !== 0)
    lines.push({ role: salesRole, debit: 0, credit: params.totalHT });
  if (params.totalTVA !== 0)
    lines.push({ role: "TVA_COLLECTEE", debit: 0, credit: params.totalTVA });
  return lines;
}

/**
 * Écriture d'encaissement d'une facture : Banque ou Caisse au débit,
 * 411 Clients au crédit — solde la créance client à due concurrence du montant réglé.
 */
export function buildPaymentEntryLines(params: {
  amount: number;
  toBank: boolean;
}): RoleLine[] {
  return [
    {
      role: params.toBank ? "BANQUE" : "CAISSE",
      debit: params.amount,
      credit: 0,
    },
    { role: "CLIENTS", debit: 0, credit: params.amount },
  ];
}

/**
 * Écriture de paie (validation d'un bulletin) : 661 Charges de personnel au
 * débit pour le brut total, 421 Personnel - rémunérations dues au crédit pour le
 * net à payer, 431 Organismes sociaux au crédit pour les cotisations retenues.
 */
export function buildPayrollEntryLines(params: {
  totalGross: number;
  socialContribution: number;
  netSalary: number;
}): RoleLine[] {
  const lines: RoleLine[] = [
    { role: "CHARGES_PERSONNEL", debit: params.totalGross, credit: 0 },
  ];
  if (params.socialContribution !== 0)
    lines.push({
      role: "ORGANISMES_SOCIAUX",
      debit: 0,
      credit: params.socialContribution,
    });
  lines.push({
    role: "PERSONNEL_REMUNERATIONS_DUES",
    debit: 0,
    credit: params.netSalary,
  });
  return lines;
}

/**
 * Écriture d'achat (facture fournisseur reçue) : 601 Achats au débit pour le
 * HT, 4452 TVA déductible au débit pour la TVA, 401 Fournisseurs au crédit
 * pour le TTC — symétrique de buildSaleEntryLines.
 */
export function buildPurchaseEntryLines(params: {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}): RoleLine[] {
  const lines: RoleLine[] = [];
  if (params.totalHT !== 0)
    lines.push({ role: "ACHATS", debit: params.totalHT, credit: 0 });
  if (params.totalTVA !== 0)
    lines.push({ role: "TVA_DEDUCTIBLE", debit: params.totalTVA, credit: 0 });
  lines.push({ role: "FOURNISSEURS", debit: 0, credit: params.totalTTC });
  return lines;
}

/**
 * Écriture de règlement d'une facture fournisseur : 401 Fournisseurs au débit
 * (solde la dette à due concurrence), Banque ou Caisse au crédit — symétrique
 * de buildPaymentEntryLines.
 */
export function buildSupplierPaymentEntryLines(params: {
  amount: number;
  toBank: boolean;
}): RoleLine[] {
  return [
    { role: "FOURNISSEURS", debit: params.amount, credit: 0 },
    {
      role: params.toBank ? "BANQUE" : "CAISSE",
      debit: 0,
      credit: params.amount,
    },
  ];
}

/**
 * Écriture de dotation aux amortissements (fin d'exercice) : 681 Dotations au
 * débit, 28xx Amortissements cumulés au crédit — pour le montant de la dotation
 * annuelle déjà calculée par le moteur du module Immobilisations.
 */
export function buildDepreciationEntryLines(params: {
  annualDotation: number;
}): RoleLine[] {
  return [
    {
      role: "DOTATIONS_AMORTISSEMENTS",
      debit: params.annualDotation,
      credit: 0,
    },
    { role: "AMORTISSEMENTS_CUMULES", debit: 0, credit: params.annualDotation },
  ];
}

/**
 * Écriture d'avoir (note de crédit émise sur une facture) : symétrique
 * exactement inverse de buildSaleEntryLines — 701/706 Ventes au débit pour le
 * HT (annule la vente), 4431 TVA collectée au débit pour la TVA, 411 Clients
 * au crédit pour le TTC (réduit la créance client).
 */
export function buildCreditNoteEntryLines(params: {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  isService?: boolean;
}): RoleLine[] {
  const salesRole: AccountRoleName = params.isService
    ? "VENTES_SERVICES"
    : "VENTES_MARCHANDISES";
  const lines: RoleLine[] = [];
  if (params.totalHT !== 0)
    lines.push({ role: salesRole, debit: params.totalHT, credit: 0 });
  if (params.totalTVA !== 0)
    lines.push({ role: "TVA_COLLECTEE", debit: params.totalTVA, credit: 0 });
  lines.push({ role: "CLIENTS", debit: 0, credit: params.totalTTC });
  return lines;
}
