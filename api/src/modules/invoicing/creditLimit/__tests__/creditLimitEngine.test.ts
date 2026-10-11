import { describe, expect, it } from 'vitest';
import { computeCreditStatus } from '../creditLimitEngine';

describe('computeCreditStatus', () => {
  it("sans limite configurée (null) -> jamais de dépassement signalé, quel que soit le montant", () => {
    const result = computeCreditStatus(null, 5000000, 10000000);
    expect(result.wouldExceed).toBe(false);
    expect(result.excessAmount).toBe(0);
    expect(result.creditLimit).toBeNull();
  });

  it('encours + nouvelle facture reste sous la limite -> aucun dépassement', () => {
    const result = computeCreditStatus(1000000, 500000, 300000);
    expect(result.projectedOutstanding).toBe(800000);
    expect(result.wouldExceed).toBe(false);
  });

  it('encours + nouvelle facture dépasse la limite -> dépassement signalé avec le montant exact', () => {
    const result = computeCreditStatus(1000000, 800000, 500000);
    expect(result.projectedOutstanding).toBe(1300000);
    expect(result.wouldExceed).toBe(true);
    expect(result.excessAmount).toBe(300000);
  });

  it('exactement à la limite (ni plus ni moins) -> pas de dépassement (limite atteinte, pas franchie)', () => {
    const result = computeCreditStatus(1000000, 700000, 300000);
    expect(result.projectedOutstanding).toBe(1000000);
    expect(result.wouldExceed).toBe(false);
  });

  it('encours déjà au-dessus de la limite avant même la nouvelle facture -> dépassement dès le départ', () => {
    const result = computeCreditStatus(1000000, 1200000, 0);
    expect(result.wouldExceed).toBe(true);
    expect(result.excessAmount).toBe(200000);
  });

  it('gère correctement les arrondis (évite les faux dépassements de type 0.1+0.2)', () => {
    const result = computeCreditStatus(1000.3, 700.1, 300.2);
    expect(result.projectedOutstanding).toBe(1000.3);
    expect(result.wouldExceed).toBe(false);
  });
});
