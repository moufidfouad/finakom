import { PosteDefinition } from "./engine.types";

export const RESULTAT_POSTES: PosteDefinition[] = [
  { ref: "TA", label: "Ventes de marchandises", prefixes: ["701"], sign: -1 },
  { ref: "RA", label: "Achats de marchandises", prefixes: ["601"] },
  { ref: "RB", label: "Variation stocks marchandises", prefixes: ["6031"] },
  {
    ref: "TB",
    label: "Ventes de produits / services",
    prefixes: ["702", "703", "704", "705", "706", "707"],
    sign: -1,
  },
  {
    ref: "TC",
    label: "Production stockée & immobilisée",
    prefixes: ["72", "73"],
    sign: -1,
  },
  {
    ref: "TD",
    label: "Subventions d'exploitation & autres produits",
    prefixes: ["71", "75"],
    sign: -1,
  },
  { ref: "RC", label: "Autres achats", prefixes: ["602", "604", "605", "608"] },
  { ref: "RD", label: "Variation stocks (autres)", prefixes: ["6032", "6033"] },
  { ref: "RE", label: "Transports", prefixes: ["61"] },
  { ref: "RF", label: "Services extérieurs", prefixes: ["62", "63"] },
  { ref: "RG", label: "Autres charges", prefixes: ["65"] },
  { ref: "RH", label: "Impôts et taxes", prefixes: ["64"] },
  { ref: "RI", label: "Charges de personnel", prefixes: ["66"] },
  {
    ref: "TE",
    label: "Reprises & transferts de charges",
    prefixes: ["781", "791", "798"],
    sign: -1,
  },
  {
    ref: "RJ",
    label: "Dotations aux amortissements & provisions",
    prefixes: ["681", "691"],
  },
  {
    ref: "TF",
    label: "Produits financiers",
    prefixes: ["77", "787", "797"],
    sign: -1,
  },
  { ref: "RK", label: "Charges financières", prefixes: ["67", "687", "697"] },
  {
    ref: "TH",
    label: "Produits HAO",
    prefixes: ["82", "84", "86", "88"],
    sign: -1,
  },
  { ref: "RL", label: "Charges HAO", prefixes: ["81", "83", "85"] },
  { ref: "RM", label: "Participation des travailleurs", prefixes: ["87"] },
  { ref: "RN", label: "Impôts sur le résultat", prefixes: ["89"] },
];
