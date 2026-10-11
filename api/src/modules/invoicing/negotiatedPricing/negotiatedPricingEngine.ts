/**
 * Moteur pur de résolution du prix effectif d'une ligne (client, article) —
 * ordre de priorité strict : prix négocié spécifique au couple client/article
 * > remise standard du client appliquée au prix catalogue > prix catalogue
 * brut. Aucun accès base de données ici (voir negotiatedPricing.service.ts).
 * Ne remplace jamais la possibilité de modifier manuellement une ligne au cas
 * par cas — ce moteur ne fait que déterminer une valeur PROPOSÉE par défaut.
 */

export interface ResolveLinePriceParams {
  catalogPriceHT: number;
  negotiatedPriceHT: number | null; // prix spécifique pour ce couple (client, article), s'il existe
  clientDiscountPercent: number | null; // remise standard du client (0-100), s'il n'y a pas de prix négocié
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function resolveLinePrice(params: ResolveLinePriceParams): number {
  if (params.negotiatedPriceHT !== null) return params.negotiatedPriceHT;
  if (params.clientDiscountPercent !== null) {
    return round2(
      params.catalogPriceHT * (1 - params.clientDiscountPercent / 100),
    );
  }
  return params.catalogPriceHT;
}
