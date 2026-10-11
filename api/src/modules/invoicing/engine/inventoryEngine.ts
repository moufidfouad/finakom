/**
 * Moteur de calcul du stock. Reproduit fidèlement l'onglet "Suivi du Stock" :
 * Stock Final = Stock initial + Entrées - Sorties
 * Alerte : 0 = rupture, 1 = sous le seuil mini, 2 = OK
 */

export type StockAlertLevel = 0 | 1 | 2;
export type StockAlertLabel = "Rupture" | "Sous le seuil" | "OK";

export interface StockCalc {
  stockInitial: number;
  totalEntries: number;
  totalExits: number;
  stockFinal: number;
  stockMin: number;
  alertLevel: StockAlertLevel;
  alertLabel: StockAlertLabel;
  unitCost: number;
  stockValue: number;
}

/** Reproduit H=D+(E-F), G=IFS(H<=0,0, H<=mini,1, H>mini,2) */
export function computeStock(params: {
  stockInitial: number;
  entries: number;
  exits: number;
  stockMin: number;
  unitCost: number;
}): StockCalc {
  const stockFinal = params.stockInitial + (params.entries - params.exits);

  let alertLevel: StockAlertLevel;
  if (stockFinal <= 0) alertLevel = 0;
  else if (stockFinal <= params.stockMin) alertLevel = 1;
  else alertLevel = 2;

  const alertLabel: StockAlertLabel =
    alertLevel === 0 ? "Rupture" : alertLevel === 1 ? "Sous le seuil" : "OK";

  return {
    stockInitial: params.stockInitial,
    totalEntries: params.entries,
    totalExits: params.exits,
    stockFinal,
    stockMin: params.stockMin,
    alertLevel,
    alertLabel,
    unitCost: params.unitCost,
    stockValue: stockFinal * params.unitCost,
  };
}

export function sumMovements(movements: { type: string; quantity: number }[]): {
  entries: number;
  exits: number;
} {
  return movements.reduce(
    (acc, m) => {
      if (m.type === "Entrée") acc.entries += m.quantity;
      else if (m.type === "Sortie") acc.exits += m.quantity;
      return acc;
    },
    { entries: 0, exits: 0 },
  );
}
