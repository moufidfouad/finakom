import { describe, expect, it } from 'vitest';
import { computeStock, sumMovements } from '../inventoryEngine';

describe('Moteur de stock — Calcul du stock final et des alertes', () => {
  it('reproduit le calcul du "Produit A" du classeur (stock 20, entrée 0, sortie 4)', () => {
    const stock = computeStock({ stockInitial: 20, entries: 0, exits: 4, stockMin: 15, unitCost: 7.4 });
    expect(stock.stockFinal).toBe(16);
    expect(stock.alertLevel).toBe(2); // 16 > 15 → OK
    expect(stock.alertLabel).toBe('OK');
    expect(stock.stockValue).toBeCloseTo(16 * 7.4, 5);
  });

  it('reproduit le calcul du "Produit D" (stock bas, sous le seuil mini)', () => {
    // Stock initial 10, sortie 0, entrée 12 -> 22 ... testons plutôt un cas sous le seuil
    const stock = computeStock({ stockInitial: 10, entries: 0, exits: 6, stockMin: 5, unitCost: 14.9 });
    expect(stock.stockFinal).toBe(4);
    expect(stock.alertLevel).toBe(1); // 4 <= 5 → sous le seuil
    expect(stock.alertLabel).toBe('Sous le seuil');
  });

  it('détecte une rupture de stock (stock final <= 0)', () => {
    const stock = computeStock({ stockInitial: 5, entries: 0, exits: 8, stockMin: 5, unitCost: 10 });
    expect(stock.stockFinal).toBe(-3);
    expect(stock.alertLevel).toBe(0);
    expect(stock.alertLabel).toBe('Rupture');
  });

  it('agrège les mouvements entrée/sortie', () => {
    const movements = [
      { type: 'Entrée', quantity: 10 },
      { type: 'Sortie', quantity: 3 },
      { type: 'Entrée', quantity: 5 },
      { type: 'Sortie', quantity: 2 },
    ];
    const { entries, exits } = sumMovements(movements);
    expect(entries).toBe(15);
    expect(exits).toBe(5);
  });
});
