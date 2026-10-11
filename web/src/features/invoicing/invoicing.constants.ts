export const CLIENT_TYPES = ["Entreprise", "Particulier"];
export const CLIENT_QUALITIES = ["Nouveau", "Bon", "Excellent"];
export const PRODUCT_UNITS = [
  "Unité",
  "Carton",
  "Boîte",
  "Sac",
  "Palette",
  "Paquet",
  "Rouleau",
  "Lot",
  "Forfait",
  "Heure",
  "Jour",
  "Semaine",
  "Mois",
  "Année",
  "Mètre",
  "m²",
  "m³",
  "Kg",
  "Tonne",
  "Litre",
  "Licence",
];
export const PRODUCT_CATEGORIES = [
  "Matériel informatique",
  "Logiciel",
  "Électroménager",
  "Consommable",
  "Fournitures",
  "Mobilier",
  "Alimentaire",
  "Textile & habillement",
  "Matériaux de construction",
  "Équipement médical",
  "Véhicules & pièces détachées",
  "Énergie & carburant",
  "Agriculture & pêche",
  "Transport & logistique",
  "Service",
  "Autre",
];
export const DOCUMENT_TYPES = ["Devis", "Facture", "Bon de livraison"] as const;
export const STATUS_BY_TYPE: Record<string, string[]> = {
  Devis: ["Envoyé", "Accepté", "Refusé", "Expiré"],
  "Bon de livraison": ["En préparation", "Livré"],
};
export const PAYMENT_METHODS = [
  "Virement",
  "Mobile Money",
  "Espèces",
  "Chèque",
];
