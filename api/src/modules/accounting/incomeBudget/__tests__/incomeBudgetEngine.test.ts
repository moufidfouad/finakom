import { describe, expect, it } from 'vitest';
import { computeMonthlyIncomeComparison, signedIncomeAmount } from '../incomeBudgetEngine';

describe('computeMonthlyIncomeComparison — cas vérifié à la main', () => {
  it('mois 1 : budget produits 100000/charges 60000, réel produits 95000/charges 65000', () => {
    const result = computeMonthlyIncomeComparison(
      [{ month: 1, type: 'Produit', amount: 100000 }, { month: 1, type: 'Charge', amount: 60000 }],
      [{ month: 1, type: 'Produit', amount: 95000 }, { month: 1, type: 'Charge', amount: 65000 }]
    );
    const jan = result[0];
    expect(jan.budgetResult).toBe(40000);
    expect(jan.actualResult).toBe(30000);
    expect(jan.revenueVariance).toBe(-5000); // sous l'objectif
    expect(jan.expenseVariance).toBe(5000); // dépassement
    expect(jan.resultVariance).toBe(-10000); // résultat en dessous du prévu
  });

  it('retourne toujours 12 mois, même sans aucune donnée', () => {
    const result = computeMonthlyIncomeComparison([], []);
    expect(result).toHaveLength(12);
    expect(result.every((m) => m.budgetResult === 0 && m.actualResult === 0)).toBe(true);
  });

  it('agrège correctement plusieurs lignes du même mois et type (plusieurs comptes de charges)', () => {
    const result = computeMonthlyIncomeComparison(
      [],
      [{ month: 3, type: 'Charge', amount: 10000 }, { month: 3, type: 'Charge', amount: 5000 }]
    );
    expect(result[2].actualExpense).toBe(15000);
  });

  it('un mois sans aucune ligne budgétée mais avec du réel -> variance égale au réel (dépassement total)', () => {
    const result = computeMonthlyIncomeComparison([], [{ month: 5, type: 'Charge', amount: 20000 }]);
    expect(result[4].expenseVariance).toBe(20000);
  });

  it('variance de résultat positive quand le réel dépasse le budget (bonne nouvelle)', () => {
    const result = computeMonthlyIncomeComparison(
      [{ month: 2, type: 'Produit', amount: 50000 }],
      [{ month: 2, type: 'Produit', amount: 70000 }]
    );
    expect(result[1].resultVariance).toBe(20000);
  });

  it('gère correctement les arrondis (évite les faux écarts de type 0.1+0.2)', () => {
    const result = computeMonthlyIncomeComparison(
      [{ month: 6, type: 'Produit', amount: 100.1 }],
      [{ month: 6, type: 'Produit', amount: 100.3 }]
    );
    expect(result[5].revenueVariance).toBe(0.2);
  });
});

describe('signedIncomeAmount', () => {
  it('un compte de charge (classe 6) débité -> montant positif (charge normale)', () => {
    const result = signedIncomeAmount({ classe: '6', debit: 50000, credit: 0 });
    expect(result).toEqual({ type: 'Charge', amount: 50000 });
  });

  it('un compte de charge crédité (ex: avoir fournisseur) -> réduit la charge (montant négatif)', () => {
    const result = signedIncomeAmount({ classe: '6', debit: 0, credit: 5000 });
    expect(result).toEqual({ type: 'Charge', amount: -5000 });
  });

  it('un compte de produit (classe 7) crédité -> montant positif (vente normale)', () => {
    const result = signedIncomeAmount({ classe: '7', debit: 0, credit: 100000 });
    expect(result).toEqual({ type: 'Produit', amount: 100000 });
  });

  it('un compte de produit débité (ex: avoir client) -> réduit le produit (montant négatif)', () => {
    const result = signedIncomeAmount({ classe: '7', debit: 3000, credit: 0 });
    expect(result).toEqual({ type: 'Produit', amount: -3000 });
  });

  it('un compte hors classe 6/7 (ex: classe 4 client) -> null, ignoré du compte de résultat', () => {
    const result = signedIncomeAmount({ classe: '4', debit: 10000, credit: 0 });
    expect(result).toBeNull();
  });
});
