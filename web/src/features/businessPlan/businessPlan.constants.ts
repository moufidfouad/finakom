export const FUNDING_TYPES = [
  "Apport personnel",
  "Emprunt bancaire",
  "Subvention",
  "Love money",
  "Autre",
];

export const PL_SECTIONS: { value: string; label: string }[] = [
  { value: "ChiffreAffaires", label: "Chiffre d'affaires" },
  { value: "ChargesVariables", label: "Charges variables" },
  { value: "ChargesFixes", label: "Charges fixes" },
  { value: "ChargesPersonnel", label: "Charges de personnel" },
  { value: "ImpotsTaxes", label: "Impôts et taxes" },
  { value: "ChargesFinancieres", label: "Charges financières" },
  { value: "ImpotSocietes", label: "Impôt sur les sociétés" },
];

export const CASHFLOW_CATEGORIES_INFLOW = [
  "Apport personnel",
  "Emprunts / Prêts",
  "Subventions",
  "Autres recettes",
  "TVA",
  "Vente de marchandises",
  "Prestations de services",
];
export const CASHFLOW_CATEGORIES_OUTFLOW = [
  "Achats",
  "Loyer",
  "Assurances",
  "Fournitures",
  "Communication",
  "Rémunération du dirigeant",
  "Cotisations sociales",
  "Salaires employés",
  "Charges sociales employés",
  "Remboursement emprunt",
  "Autres charges",
];

export const ASSET_CATEGORIES = [
  "Immobilisations incorporelles",
  "Immobilisations corporelles",
  "Immobilisations financières",
  "Stocks",
  "Créances clients",
  "Créance TVA",
];
export const LIABILITY_CATEGORIES = [
  "Apport personnel",
  "Réserves",
  "Emprunts",
  "Dettes fournisseurs",
  "Dettes fiscales et sociales",
];

export const NARRATIVE_SECTION_FIELDS: {
  key: keyof import("@/types").NarrativeSections;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "presentation",
    label: "Présentation du projet",
    placeholder:
      "Décrivez votre entreprise, son activité, ce qui la rend unique…",
  },
  {
    key: "executiveSummary",
    label: "Synthèse / Executive summary",
    placeholder: "Résumé en quelques lignes : mission, vision, objectifs…",
  },
  {
    key: "organisation",
    label: "Organisation de l'entreprise",
    placeholder: "Équipe, rôles, plan de ressources humaines…",
  },
  {
    key: "marketStudy",
    label: "Étude de marché",
    placeholder: "Taille du marché, évolution, tendances, structure…",
  },
  {
    key: "pestel",
    label: "Analyse PESTEL",
    placeholder:
      "Facteurs politiques, économiques, sociaux, technologiques, écologiques, légaux…",
  },
  {
    key: "swot",
    label: "Analyse SWOT",
    placeholder: "Forces, faiblesses, opportunités, menaces…",
  },
  {
    key: "competitors",
    label: "Analyse concurrentielle",
    placeholder: "Principaux concurrents, positionnement, benchmark…",
  },
  {
    key: "targetClients",
    label: "Clients et cibles",
    placeholder: "Personas, parcours client…",
  },
  {
    key: "offerPricing",
    label: "Offre et tarification",
    placeholder: "Produits/services proposés, grille tarifaire…",
  },
  {
    key: "strategy",
    label: "Stratégie et communication",
    placeholder: "Objectifs de communication, canaux, plan marketing…",
  },
];
