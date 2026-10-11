import { PosteDefinition } from "./engine.types";

export const ACTIF_IMMOBILISE: PosteDefinition[] = [
  { ref: "AD", label: "Immobilisations incorporelles", prefixes: ["20", "21"] },
  {
    ref: "AI",
    label: "Immobilisations corporelles",
    prefixes: ["22", "23", "24"],
  },
  { ref: "AQ", label: "Immobilisations financières", prefixes: ["26", "27"] },
];

export const ACTIF_CIRCULANT: PosteDefinition[] = [
  { ref: "BA", label: "Actif circulant HAO", prefixes: ["485", "488"] },
  {
    ref: "BB",
    label: "Stocks et en-cours",
    prefixes: ["31", "32", "33", "34", "35", "36", "37", "38"],
  },
  { ref: "BG", label: "Créances clients", prefixes: ["41"] },
  {
    ref: "BH",
    label: "Autres créances",
    prefixes: ["409", "42", "43", "44", "45", "46", "47"],
  },
];

export const TRESORERIE_ACTIF: PosteDefinition[] = [
  { ref: "BR", label: "Titres de placement", prefixes: ["50"] },
  { ref: "BS", label: "Valeurs à encaisser", prefixes: ["51"] },
  {
    ref: "BT",
    label: "Banques, caisses",
    prefixes: ["52", "53", "54", "55", "57"],
  },
];

export const CAPITAUX_PROPRES: PosteDefinition[] = [
  { ref: "CA", label: "Capital", prefixes: ["10"], sign: -1 },
  { ref: "CD", label: "Primes & réserves", prefixes: ["11", "12"], sign: -1 },
  { ref: "CH", label: "Report à nouveau", prefixes: ["13"], sign: -1 },
  {
    ref: "CJ",
    label: "Résultat net de l'exercice",
    prefixes: ["130", "131"],
    sign: -1,
  },
  {
    ref: "CK",
    label: "Subventions & prov. réglementées",
    prefixes: ["14", "15"],
    sign: -1,
  },
];

export const DETTES_FINANCIERES: PosteDefinition[] = [
  {
    ref: "DA",
    label: "Emprunts & dettes financières",
    prefixes: ["16", "17", "18"],
    sign: -1,
  },
  { ref: "DB", label: "Provisions financières", prefixes: ["19"], sign: -1 },
];

export const PASSIF_CIRCULANT: PosteDefinition[] = [
  {
    ref: "DH",
    label: "Dettes circulantes HAO",
    prefixes: ["481", "482", "484"],
    sign: -1,
  },
  { ref: "DI", label: "Clients avances reçues", prefixes: ["419"], sign: -1 },
  {
    ref: "DJ",
    label: "Fournisseurs d'exploitation",
    prefixes: ["40"],
    sign: -1,
  },
  {
    ref: "DK",
    label: "Dettes fiscales & sociales",
    prefixes: ["42", "43", "44"],
    sign: -1,
  },
  { ref: "DM", label: "Autres dettes", prefixes: ["45", "46", "47"], sign: -1 },
];

export const TRESORERIE_PASSIF: PosteDefinition[] = [
  {
    ref: "DQ",
    label: "Banques crédits trésorerie",
    prefixes: ["561", "564", "565"],
    sign: -1,
  },
  { ref: "DR", label: "Banques découverts", prefixes: ["566"], sign: -1 },
];
