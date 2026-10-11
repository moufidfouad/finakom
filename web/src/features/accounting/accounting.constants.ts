export const JOURNAL_TYPES: { value: string; label: string }[] = [
  { value: "ACHATS", label: "Achats" },
  { value: "VENTES", label: "Ventes" },
  { value: "BANQUE", label: "Banque" },
  { value: "CAISSE", label: "Caisse" },
  { value: "OD", label: "Opérations diverses" },
  { value: "PAIE", label: "Paie" },
];

export const ACCOUNT_ROLES: { value: string; label: string }[] = [
  { value: "CLIENTS", label: "Clients" },
  { value: "FOURNISSEURS", label: "Fournisseurs" },
  { value: "VENTES_MARCHANDISES", label: "Ventes de marchandises" },
  { value: "VENTES_SERVICES", label: "Ventes de services" },
  { value: "TVA_COLLECTEE", label: "TVA collectée" },
  { value: "TVA_DEDUCTIBLE", label: "TVA déductible" },
  { value: "BANQUE", label: "Banque" },
  { value: "CAISSE", label: "Caisse" },
  { value: "CHARGES_PERSONNEL", label: "Charges de personnel" },
  {
    value: "PERSONNEL_REMUNERATIONS_DUES",
    label: "Personnel — rémunérations dues",
  },
  { value: "ORGANISMES_SOCIAUX", label: "Organismes sociaux" },
  { value: "DOTATIONS_AMORTISSEMENTS", label: "Dotations aux amortissements" },
  { value: "AMORTISSEMENTS_CUMULES", label: "Amortissements cumulés" },
];
