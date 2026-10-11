import { describe, expect, it } from 'vitest';
import { computeVatSummary } from '../vatSummaryEngine';

describe('computeVatSummary — cas vérifié à la main : vente 100 000 HT (18%) / achat 50 000 HT (18%)', () => {
  it('calcule la TVA à payer (collectée > déductible)', () => {
    // Vente : TVA collectée créditée de 18 000. Achat : TVA déductible débitée de 9 000.
    const result = computeVatSummary(
      [{ debit: 0, credit: 18000 }],
      [{ debit: 9000, credit: 0 }]
    );
    expect(result.totalCollected).toBe(18000);
    expect(result.totalDeductible).toBe(9000);
    expect(result.netVat).toBe(9000);
    expect(result.isCredit).toBe(false);
  });

  it('calcule un crédit de TVA reportable (déductible > collectée, ex: mois de gros investissement)', () => {
    const result = computeVatSummary(
      [{ debit: 0, credit: 9000 }],
      [{ debit: 18000, credit: 0 }]
    );
    expect(result.netVat).toBe(-9000);
    expect(result.isCredit).toBe(true);
  });

  it('agrège correctement plusieurs lignes sur chaque compte (plusieurs ventes/achats dans la période)', () => {
    const result = computeVatSummary(
      [{ debit: 0, credit: 18000 }, { debit: 0, credit: 9000 }, { debit: 0, credit: 4500 }],
      [{ debit: 9000, credit: 0 }, { debit: 3600, credit: 0 }]
    );
    expect(result.totalCollected).toBe(31500);
    expect(result.totalDeductible).toBe(12600);
    expect(result.netVat).toBe(18900);
  });

  it('gère une annulation partielle (avoir) qui débite le compte TVA collectée', () => {
    // Vente 18000 créditée, puis avoir qui débite 3000 (TVA restituée) -> solde net 15000
    const result = computeVatSummary(
      [{ debit: 0, credit: 18000 }, { debit: 3000, credit: 0 }],
      []
    );
    expect(result.totalCollected).toBe(15000);
  });

  it('retourne zéro partout en l\'absence de toute écriture', () => {
    const result = computeVatSummary([], []);
    expect(result.netVat).toBe(0);
    expect(result.isCredit).toBe(false);
  });

  it('gère correctement les arrondis (évite les faux écarts de type 0.1+0.2)', () => {
    const result = computeVatSummary(
      [{ debit: 0, credit: 100.1 }, { debit: 0, credit: 0.2 }],
      [{ debit: 50.15, credit: 0 }]
    );
    expect(result.totalCollected).toBe(100.3);
    expect(result.netVat).toBe(50.15);
  });
});
