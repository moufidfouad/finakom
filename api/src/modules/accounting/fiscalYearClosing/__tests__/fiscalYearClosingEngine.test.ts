import { describe, expect, it } from 'vitest';
import { computeClosingEntry } from '../fiscalYearClosingEngine';
import { checkEntryBalance } from '@/modules/accounting/engine/ledgerEngine';

function toBalanceCheckInput(lines: { accountNumber: string; debit: number; credit: number }[]) {
  return lines.map((l) => ({ accountNumber: l.accountNumber, debit: l.debit, credit: l.credit }));
}

describe('computeClosingEntry — cas vérifiés à la main avant implémentation', () => {
  it('bénéfice : Charges 100 / Produits 150 -> résultat +50, écriture équilibrée', () => {
    const result = computeClosingEntry([
      { accountNumber: '601000', classe: '6', debitN: 100, creditN: 0 },
      { accountNumber: '701000', classe: '7', debitN: 0, creditN: 150 },
    ]);
    expect(result.totalCharges).toBe(100);
    expect(result.totalProduits).toBe(150);
    expect(result.netResult).toBe(50);
    expect(result.lines).toContainEqual({ accountNumber: '601000', debit: 0, credit: 100 });
    expect(result.lines).toContainEqual({ accountNumber: '701000', debit: 150, credit: 0 });
    expect(result.lines).toContainEqual({ accountNumber: '130', debit: 0, credit: 50 });
    expect(checkEntryBalance(toBalanceCheckInput(result.lines)).isBalanced).toBe(true);
  });

  it('perte : Charges 150 / Produits 100 -> résultat -50, écriture équilibrée', () => {
    const result = computeClosingEntry([
      { accountNumber: '601000', classe: '6', debitN: 150, creditN: 0 },
      { accountNumber: '701000', classe: '7', debitN: 0, creditN: 100 },
    ]);
    expect(result.netResult).toBe(-50);
    expect(result.lines).toContainEqual({ accountNumber: '129', debit: 50, credit: 0 });
    expect(checkEntryBalance(toBalanceCheckInput(result.lines)).isBalanced).toBe(true);
  });

  it('résultat exactement nul -> aucune ligne 129/130 générée (rien à équilibrer)', () => {
    const result = computeClosingEntry([
      { accountNumber: '601000', classe: '6', debitN: 100, creditN: 0 },
      { accountNumber: '701000', classe: '7', debitN: 0, creditN: 100 },
    ]);
    expect(result.netResult).toBe(0);
    expect(result.lines.find((l) => l.accountNumber === '130' || l.accountNumber === '129')).toBeUndefined();
  });

  it('ignore les comptes de bilan (classes 1 à 5) — jamais soldés par la clôture', () => {
    const result = computeClosingEntry([
      { accountNumber: '411000', classe: '4', debitN: 500000, creditN: 0 },
      { accountNumber: '521000', classe: '5', debitN: 200000, creditN: 0 },
      { accountNumber: '601000', classe: '6', debitN: 100, creditN: 0 },
      { accountNumber: '701000', classe: '7', debitN: 0, creditN: 100 },
    ]);
    expect(result.lines.find((l) => l.accountNumber === '411000')).toBeUndefined();
    expect(result.lines.find((l) => l.accountNumber === '521000')).toBeUndefined();
  });

  it('ignore les comptes déjà à solde nul (rien à solder)', () => {
    const result = computeClosingEntry([
      { accountNumber: '601000', classe: '6', debitN: 100, creditN: 100 },
    ]);
    expect(result.lines).toHaveLength(0);
  });

  it('gère plusieurs comptes de charges et de produits simultanément, toujours équilibré', () => {
    const result = computeClosingEntry([
      { accountNumber: '601000', classe: '6', debitN: 60000, creditN: 0 },
      { accountNumber: '661000', classe: '6', debitN: 40000, creditN: 0 },
      { accountNumber: '701000', classe: '7', debitN: 0, creditN: 90000 },
      { accountNumber: '707000', classe: '7', debitN: 0, creditN: 30000 },
    ]);
    expect(result.totalCharges).toBe(100000);
    expect(result.totalProduits).toBe(120000);
    expect(result.netResult).toBe(20000);
    expect(checkEntryBalance(toBalanceCheckInput(result.lines)).isBalanced).toBe(true);
  });
});
