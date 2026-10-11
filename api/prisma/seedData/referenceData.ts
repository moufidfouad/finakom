/**
 * Pools de données réalistes, réutilisés à travers les différents modules de
 * seed — noms, entreprises, clients, fournisseurs, produits, employés.
 * Volontairement variés (pas de "Client 1", "Produit 2") pour permettre de
 * tester recherche, tri et filtres sur des données qui ressemblent à un vrai
 * usage. Ancrés dans le contexte comorien (déjà le positionnement du seed
 * historique), élargis en nombre plutôt que remplacés.
 */

export interface CompanySeedSpec {
  name: string;
  country: string;
  currency: string;
  sector: string;
  address: string;
  /** Absent = reste en Brouillon (comportement par défaut du schéma) — pour
   * tester les deux états dans l'annuaire public plutôt que de tout publier. */
  directoryVisibility?: "Public";
  publicDescription?: string;
  accountingSystem: "Normal" | "SMT";
  fiscalRegime: string;
  scale: number; // facteur d'échelle pour varier les montants entre entreprises
}

export interface UserSeedSpec {
  email: string;
  fullName: string;
  role: "USER" | "SUPERADMIN";
  companies: CompanySeedSpec[];
}

export const USERS: UserSeedSpec[] = [
  {
    email: "superadmin@finakom.app",
    fullName: "Super Administrateur",
    role: "SUPERADMIN",
    companies: [],
  },
  {
    email: "ahmed.negoce@finakom.app",
    fullName: "Ahmed Mohamed",
    role: "USER",
    companies: [
      {
        name: "Ahmed Import-Export",
        country: "Comores",
        currency: "KMF",
        sector: "Commerce général",
        address: "Avenue de la Corniche, Moroni",
        directoryVisibility: "Public",
        publicDescription:
          "Import-export de biens de consommation courante entre l'Afrique de l'Est et l'espace OHADA, plus de 15 ans d'activité aux Comores.",
        accountingSystem: "Normal",
        fiscalRegime: "Réel normal",
        scale: 1,
      },
    ],
  },
  {
    email: "nouriat.conseils@finakom.app",
    fullName: "Nouriat Saïd",
    role: "USER",
    companies: [
      {
        name: "Nouriat Conseils & Services",
        country: "Comores",
        currency: "KMF",
        sector: "Services financiers",
        address: "Rue Ahmed Abdallah, Moroni",
        directoryVisibility: "Public",
        publicDescription:
          "Cabinet de conseil en stratégie et gestion financière pour PME de l'espace OHADA.",
        accountingSystem: "Normal",
        fiscalRegime: "Réel simplifié",
        scale: 0.6,
      },
    ],
  },
  {
    email: "bacar.groupe@finakom.app",
    fullName: "Ibrahim Bacar",
    role: "USER",
    companies: [
      {
        name: "Bacar Négoce SARL",
        country: "Comores",
        currency: "KMF",
        sector: "Commerce général",
        address: "Zone industrielle de Voidjou, Moroni",
        accountingSystem: "Normal",
        fiscalRegime: "Réel normal",
        scale: 1.4,
      },
      {
        name: "Bacar BTP SARL",
        country: "Comores",
        currency: "KMF",
        sector: "BTP & Construction",
        address: "Route de Vouvouni, Moroni",
        directoryVisibility: "Public",
        publicDescription:
          "Entreprise de construction spécialisée dans les bâtiments industriels et commerciaux, présente dans tout l'archipel.",
        accountingSystem: "Normal",
        fiscalRegime: "Réel normal",
        scale: 2.2,
      },
    ],
  },
  {
    email: "djohar.holding@finakom.app",
    fullName: "Chamsia Djohar",
    role: "USER",
    companies: [
      {
        name: "Djohar Import-Export",
        country: "Comores",
        currency: "KMF",
        sector: "Transport & Logistique",
        address: "Port de Mutsamudu, Anjouan",
        accountingSystem: "Normal",
        fiscalRegime: "Réel normal",
        scale: 1.8,
      },
      {
        name: "Djohar Épices & Essences",
        country: "Comores",
        currency: "KMF",
        sector: "Agriculture / Agro-industrie",
        address: "Route de Sima, Anjouan",
        accountingSystem: "SMT",
        fiscalRegime: "Régime de la Synthèse (SMT)",
        scale: 0.8,
      },
    ],
  },
];

export const CLIENT_POOL = [
  { name: "Établissements Al-Amin", type: "Entreprise", quality: "Excellent" },
  { name: "Boutique Chez Halima", type: "Particulier", quality: "Bon" },
  { name: "Groupe Ngazidja Commerce", type: "Entreprise", quality: "Bon" },
  { name: "Saïd Ahmed Bourhane", type: "Particulier", quality: "Nouveau" },
  { name: "Comores Négoce & Fils", type: "Entreprise", quality: "Excellent" },
  { name: "Pharmacie El Maarouf", type: "Entreprise", quality: "Excellent" },
  { name: "Hôtel Le Karthala", type: "Entreprise", quality: "Bon" },
  { name: "Fatima Bacar Djae", type: "Particulier", quality: "Bon" },
  {
    name: "Quincaillerie Moderne Mutsamudu",
    type: "Entreprise",
    quality: "Bon",
  },
  { name: "Restaurant La Coupole", type: "Entreprise", quality: "Nouveau" },
  { name: "Youssouf Ali Mmadi", type: "Particulier", quality: "Nouveau" },
  {
    name: "Supermarché Prix Bas Fomboni",
    type: "Entreprise",
    quality: "Excellent",
  },
  { name: "École Privée Al-Iqra", type: "Entreprise", quality: "Bon" },
  { name: "Salim Abdou Combo", type: "Particulier", quality: "Bon" },
  { name: "Clinique El Nour", type: "Entreprise", quality: "Excellent" },
];

export const SUPPLIER_POOL = [
  {
    name: "Grossiste Anjouan Import",
    type: "Entreprise",
    quality: "Excellent",
  },
  { name: "Mze Fournitures Générales", type: "Entreprise", quality: "Bon" },
  { name: "Coopérative Agricole de Mwali", type: "Entreprise", quality: "Bon" },
  { name: "Comores Négoce Import", type: "Entreprise", quality: "Bon" },
  {
    name: "Établissements Chanfi & Frères",
    type: "Entreprise",
    quality: "Excellent",
  },
  {
    name: "Import-Export Océan Indien",
    type: "Entreprise",
    quality: "Nouveau",
  },
  {
    name: "Distributeur Grande Comore Matériaux",
    type: "Entreprise",
    quality: "Bon",
  },
  {
    name: "Fournisseur Dubaï Trading Co.",
    type: "Entreprise",
    quality: "Excellent",
  },
];

export const PRODUCT_POOL = [
  {
    designation: 'Ordinateur portable ProBook 15"',
    unit: "Unité",
    category: "Matériel informatique",
    sellingPriceHT: 450000,
    unitCost: 360000,
    trackInventory: true,
    stockMin: 5,
    stockInitial: 22,
  },
  {
    designation: "Onduleur 1500VA",
    unit: "Unité",
    category: "Matériel informatique",
    sellingPriceHT: 85000,
    unitCost: 62000,
    trackInventory: true,
    stockMin: 8,
    stockInitial: 14,
  },
  {
    designation: "Rame de papier A4 (500 f.)",
    unit: "Carton",
    category: "Fournitures",
    sellingPriceHT: 4500,
    unitCost: 3200,
    trackInventory: true,
    stockMin: 20,
    stockInitial: 60,
  },
  {
    designation: "Prestation de conseil (jour)",
    unit: "Jour",
    category: "Service",
    sellingPriceHT: 150000,
    unitCost: null,
    trackInventory: false,
    stockMin: 0,
    stockInitial: 0,
  },
  {
    designation: "Abonnement logiciel de gestion",
    unit: "Mois",
    category: "Logiciel",
    sellingPriceHT: 35000,
    unitCost: null,
    trackInventory: false,
    stockMin: 0,
    stockInitial: 0,
  },
  {
    designation: "Sac de riz parfumé 25kg",
    unit: "Sac",
    category: "Alimentaire",
    sellingPriceHT: 18500,
    unitCost: 14200,
    trackInventory: true,
    stockMin: 30,
    stockInitial: 8,
  },
  {
    designation: "Ciment CEM II 50kg",
    unit: "Sac",
    category: "Matériaux BTP",
    sellingPriceHT: 6800,
    unitCost: 5100,
    trackInventory: true,
    stockMin: 100,
    stockInitial: 340,
  },
  {
    designation: "Tôle bac aluminium 3m",
    unit: "Unité",
    category: "Matériaux BTP",
    sellingPriceHT: 22000,
    unitCost: 17500,
    trackInventory: true,
    stockMin: 15,
    stockInitial: 0,
  },
  {
    designation: "Groupe électrogène 5kVA",
    unit: "Unité",
    category: "Équipement",
    sellingPriceHT: 680000,
    unitCost: 540000,
    trackInventory: true,
    stockMin: 2,
    stockInitial: 3,
  },
  {
    designation: "Climatiseur split 12000 BTU",
    unit: "Unité",
    category: "Électroménager",
    sellingPriceHT: 275000,
    unitCost: 210000,
    trackInventory: true,
    stockMin: 4,
    stockInitial: 6,
  },
  {
    designation: "Vanille noire qualité export (kg)",
    unit: "Kg",
    category: "Agro-industrie",
    sellingPriceHT: 145000,
    unitCost: 98000,
    trackInventory: true,
    stockMin: 10,
    stockInitial: 42,
  },
  {
    designation: "Essence Ylang-Ylang 1er choix (L)",
    unit: "Litre",
    category: "Agro-industrie",
    sellingPriceHT: 320000,
    unitCost: 240000,
    trackInventory: true,
    stockMin: 5,
    stockInitial: 12,
  },
  {
    designation: "Clous de girofle séchés (kg)",
    unit: "Kg",
    category: "Agro-industrie",
    sellingPriceHT: 9500,
    unitCost: 6800,
    trackInventory: true,
    stockMin: 50,
    stockInitial: 4,
  },
  {
    designation: "Formation bureautique (session)",
    unit: "Session",
    category: "Service",
    sellingPriceHT: 85000,
    unitCost: null,
    trackInventory: false,
    stockMin: 0,
    stockInitial: 0,
  },
  {
    designation: "Maintenance informatique (contrat mensuel)",
    unit: "Mois",
    category: "Service",
    sellingPriceHT: 65000,
    unitCost: null,
    trackInventory: false,
    stockMin: 0,
    stockInitial: 0,
  },
];

export const EMPLOYEE_POOL = [
  {
    fullName: "MOHAMED Abdou Rachid",
    position: "Comptable",
    department: "Finance",
    contractType: "CDI",
    gender: "M" as const,
  },
  {
    fullName: "SAID Halima",
    position: "Assistante commerciale",
    department: "Ventes",
    contractType: "CDI",
    gender: "F" as const,
  },
  {
    fullName: "ALI Youssouf",
    position: "Chargé de logistique",
    department: "Logistique",
    contractType: "CDD",
    gender: "M" as const,
  },
  {
    fullName: "BACAR Nouriat",
    position: "Responsable RH",
    department: "RH",
    contractType: "CDI",
    gender: "F" as const,
  },
  {
    fullName: "ABDALLAH Chamsidine",
    position: "Magasinier",
    department: "Logistique",
    contractType: "CDI",
    gender: "M" as const,
  },
  {
    fullName: "MSA Fatima",
    position: "Caissière",
    department: "Ventes",
    contractType: "CDI",
    gender: "F" as const,
  },
  {
    fullName: "ATTOUMANE Ibrahim",
    position: "Chauffeur-livreur",
    department: "Logistique",
    contractType: "CDD",
    gender: "M" as const,
  },
  {
    fullName: "DJAE Zainaba",
    position: "Chargée d'accueil",
    department: "Administration",
    contractType: "Stage",
    gender: "F" as const,
  },
];

/** Balance de bilan équilibrée (Débit=Crédit, Actif=Passif), mise à l'échelle par entreprise. */
export function buildBalanceLines(scale: number) {
  const s = (n: number) => Math.round(n * scale);
  return [
    {
      accountNumber: "101000",
      label: "Capital social",
      debitN: 0,
      creditN: s(5000000),
      debitN1: 0,
      creditN1: s(5000000),
    },
    {
      accountNumber: "121000",
      label: "Réserves & résultats antérieurs",
      debitN: 0,
      creditN: s(2450000),
      debitN1: 0,
      creditN1: s(1660000),
    },
    {
      accountNumber: "162000",
      label: "Emprunts",
      debitN: 0,
      creditN: s(2000000),
      debitN1: 0,
      creditN1: s(2500000),
    },
    {
      accountNumber: "221000",
      label: "Bâtiments (valeur nette)",
      debitN: s(4500000),
      creditN: 0,
      debitN1: s(5000000),
      creditN1: 0,
    },
    {
      accountNumber: "311000",
      label: "Stocks marchandises",
      debitN: s(1200000),
      creditN: 0,
      debitN1: s(900000),
      creditN1: 0,
    },
    {
      accountNumber: "411000",
      label: "Clients",
      debitN: s(1800000),
      creditN: 0,
      debitN1: s(1500000),
      creditN1: 0,
    },
    {
      accountNumber: "401000",
      label: "Fournisseurs",
      debitN: 0,
      creditN: s(1400000),
      debitN1: 0,
      creditN1: s(1100000),
    },
    {
      accountNumber: "571000",
      label: "Caisse",
      debitN: s(100000),
      creditN: 0,
      debitN1: s(50000),
      creditN1: 0,
    },
    {
      accountNumber: "521000",
      label: "Banque",
      debitN: s(3250000),
      creditN: 0,
      debitN1: s(2810000),
      creditN1: 0,
    },
  ];
}
