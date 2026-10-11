import { describe, expect, it } from 'vitest';
import { checkEntryBalance, computeAccountBalance, computeTrialBalance, validateLineShape } from '../ledgerEngine';

describe('checkEntryBalance — respect de la partie double', () => {
  it('détecte une écriture équilibrée', () => {
    const result = checkEntryBalance([
      { accountNumber: '411000', debit: 118000, credit: 0 },
      { accountNumber: '701000', debit: 0, credit: 100000 },
      { accountNumber: '4431', debit: 0, credit: 18000 },
    ]);
    expect(result.isBalanced).toBe(true);
    expect(result.totalDebit).toBe(118000);
    expect(result.totalCredit).toBe(118000);
    expect(result.difference).toBe(0);
  });

  it('détecte une écriture déséquilibrée', () => {
    const result = checkEntryBalance([
      { accountNumber: '411000', debit: 118000, credit: 0 },
      { accountNumber: '701000', debit: 0, credit: 100000 },
    ]);
    expect(result.isBalanced).toBe(false);
    expect(result.difference).toBe(18000);
  });

  it('gère correctement les arrondis à 2 décimales (évite les faux déséquilibres de type 0.1+0.2)', () => {
    const result = checkEntryBalance([
      { accountNumber: '411000', debit: 100.1, credit: 0 },
      { accountNumber: '701000', debit: 0, credit: 33.37 },
      { accountNumber: '701000', debit: 0, credit: 33.37 },
      { accountNumber: '701000', debit: 0, credit: 33.36 },
    ]);
    expect(result.isBalanced).toBe(true);
  });
});

describe('validateLineShape — une ligne ne mouvemente un compte que dans un seul sens', () => {
  it('rejette une ligne avec débit ET crédit simultanés', () => {
    expect(validateLineShape({ accountNumber: '411000', debit: 100, credit: 50 })).not.toBeNull();
  });

  it('rejette une ligne sans aucun montant', () => {
    expect(validateLineShape({ accountNumber: '411000', debit: 0, credit: 0 })).not.toBeNull();
  });

  it('rejette un montant négatif', () => {
    expect(validateLineShape({ accountNumber: '411000', debit: -100, credit: 0 })).not.toBeNull();
  });

  it('accepte une ligne valide (débit seul ou crédit seul)', () => {
    expect(validateLineShape({ accountNumber: '411000', debit: 100, credit: 0 })).toBeNull();
    expect(validateLineShape({ accountNumber: '701000', debit: 0, credit: 100 })).toBeNull();
  });
});

describe('computeTrialBalance — agrégation en balance par compte (format RawBalanceLine)', () => {
  const periodN = { start: new Date('2026-01-01'), end: new Date('2026-12-31') };
  const periodN1 = { start: new Date('2025-01-01'), end: new Date('2025-12-31') };

  it('agrège plusieurs écritures sur le même compte, pour la bonne période', () => {
    const lines = [
      { accountNumber: '701000', debit: 0, credit: 100000, date: new Date('2026-02-15') },
      { accountNumber: '701000', debit: 0, credit: 50000, date: new Date('2026-06-01') },
      { accountNumber: '701000', debit: 0, credit: 80000, date: new Date('2025-11-01') }, // année N-1
      { accountNumber: '411000', debit: 150000, credit: 0, date: new Date('2026-02-15') },
    ];
    const balance = computeTrialBalance(lines, periodN, periodN1);

    const ventes = balance.find((b) => b.accountNumber === '701000');
    expect(ventes?.creditN).toBe(150000);
    expect(ventes?.debitN).toBe(0);
    expect(ventes?.creditN1).toBe(80000);

    const clients = balance.find((b) => b.accountNumber === '411000');
    expect(clients?.debitN).toBe(150000);
  });

  it('ignore les écritures hors des deux périodes demandées', () => {
    const lines = [{ accountNumber: '701000', debit: 0, credit: 100000, date: new Date('2024-01-01') }];
    const balance = computeTrialBalance(lines, periodN, periodN1);
    const ventes = balance.find((b) => b.accountNumber === '701000');
    expect(ventes?.creditN).toBe(0);
    expect(ventes?.creditN1).toBe(0);
  });

  it('fonctionne sans période N-1 fournie (premier exercice de l\'entreprise)', () => {
    const lines = [{ accountNumber: '701000', debit: 0, credit: 100000, date: new Date('2026-02-15') }];
    const balance = computeTrialBalance(lines, periodN);
    expect(balance[0].creditN).toBe(100000);
    expect(balance[0].creditN1).toBe(0);
  });

  it('trie les comptes par numéro croissant', () => {
    const lines = [
      { accountNumber: '701000', debit: 0, credit: 1, date: new Date('2026-01-01') },
      { accountNumber: '411000', debit: 1, credit: 0, date: new Date('2026-01-01') },
      { accountNumber: '521000', debit: 1, credit: 0, date: new Date('2026-01-01') },
    ];
    const balance = computeTrialBalance(lines, periodN);
    expect(balance.map((b) => b.accountNumber)).toEqual(['411000', '521000', '701000']);
  });
});

describe('computeAccountBalance — solde net (débit - crédit)', () => {
  it('calcule un solde débiteur pour un compte de type actif (411 Clients)', () => {
    expect(computeAccountBalance([{ debit: 118000, credit: 0 }, { debit: 0, credit: 50000 }])).toBe(68000);
  });

  it('calcule un solde créditeur pour un compte de type produit (701 Ventes)', () => {
    expect(computeAccountBalance([{ debit: 0, credit: 100000 }])).toBe(-100000);
  });
});
