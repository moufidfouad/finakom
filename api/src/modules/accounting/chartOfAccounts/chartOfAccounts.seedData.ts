/**
 * Trame de plan comptable standard SYSCOHADA (sous-ensemble des comptes les
 * plus couramment mouvementés par une PME), utilisée pour pré-remplir le plan
 * comptable d'une nouvelle entreprise. L'entreprise reste libre d'ajouter,
 * renommer ou désactiver des comptes ensuite — cette trame n'est qu'un point de
 * départ, pas une contrainte figée (le plan comptable SYSCOHADA complet compte
 * plusieurs centaines de comptes ; en lister l'intégralité ici n'aiderait pas
 * une PME qui n'en utilise réellement qu'une vingtaine).
 */
export const STANDARD_CHART_OF_ACCOUNTS: {
  accountNumber: string;
  label: string;
  role?: string;
}[] = [
  // Classe 1 — Comptes de ressources durables
  { accountNumber: "101000", label: "Capital social" },
  { accountNumber: "120000", label: "Résultat net de l'exercice" },
  {
    accountNumber: "161000",
    label: "Emprunts auprès des établissements de crédit",
  },

  // Classe 2 — Comptes d'actif immobilisé
  { accountNumber: "211000", label: "Terrains" },
  { accountNumber: "213000", label: "Bâtiments" },
  {
    accountNumber: "218000",
    label: "Matériel informatique et mobilier de bureau",
  },
  { accountNumber: "244000", label: "Matériel de transport" },
  {
    accountNumber: "281000",
    label: "Amortissements des bâtiments",
    role: "AMORTISSEMENTS_CUMULES",
  },
  { accountNumber: "284000", label: "Amortissements du matériel" },

  // Classe 3 — Comptes de stocks
  { accountNumber: "311000", label: "Marchandises" },

  // Classe 4 — Comptes de tiers
  { accountNumber: "401000", label: "Fournisseurs", role: "FOURNISSEURS" },
  { accountNumber: "411000", label: "Clients", role: "CLIENTS" },
  {
    accountNumber: "421000",
    label: "Personnel — rémunérations dues",
    role: "PERSONNEL_REMUNERATIONS_DUES",
  },
  {
    accountNumber: "431000",
    label: "Organismes sociaux (CNSS/CNPS)",
    role: "ORGANISMES_SOCIAUX",
  },
  { accountNumber: "441000", label: "État — impôts sur les bénéfices" },
  {
    accountNumber: "4431",
    label: "État — TVA collectée",
    role: "TVA_COLLECTEE",
  },
  {
    accountNumber: "4452",
    label: "État — TVA déductible",
    role: "TVA_DEDUCTIBLE",
  },

  // Classe 5 — Comptes de trésorerie
  { accountNumber: "521000", label: "Banques", role: "BANQUE" },
  { accountNumber: "571000", label: "Caisse", role: "CAISSE" },

  // Classe 6 — Comptes de charges
  { accountNumber: "601000", label: "Achats de marchandises", role: "ACHATS" },
  {
    accountNumber: "604000",
    label: "Achats stockés de matières et fournitures",
  },
  { accountNumber: "605000", label: "Autres achats" },
  { accountNumber: "622000", label: "Locations et charges locatives" },
  { accountNumber: "624000", label: "Entretien, réparations et maintenance" },
  { accountNumber: "628000", label: "Autres charges externes" },
  { accountNumber: "641000", label: "Impôts et taxes directs" },
  {
    accountNumber: "661000",
    label: "Charges de personnel",
    role: "CHARGES_PERSONNEL",
  },
  { accountNumber: "671000", label: "Charges financières" },
  {
    accountNumber: "681000",
    label: "Dotations aux amortissements d'exploitation",
    role: "DOTATIONS_AMORTISSEMENTS",
  },
  { accountNumber: "891000", label: "Impôts sur le résultat" },

  // Classe 7 — Comptes de produits
  {
    accountNumber: "701000",
    label: "Ventes de marchandises",
    role: "VENTES_MARCHANDISES",
  },
  {
    accountNumber: "706000",
    label: "Services vendus",
    role: "VENTES_SERVICES",
  },
  { accountNumber: "707000", label: "Produits accessoires" },
  { accountNumber: "771000", label: "Produits financiers" },
];
