import { describe, expect, it } from 'vitest';
import { computeDepreciation } from '../depreciationEngine';

const closing2025 = new Date('2025-12-31T00:00:00Z');

describe('Moteur amortissement — reproduction fidèle du classeur SYSCOHADA', () => {
  it('IMM-001 Bâtiment (linéaire, 45M, acquis 2022-03-15, 20 ans)', () => {
    const result = computeDepreciation({
      grossValue: 45000000,
      acquisitionDate: new Date('2022-03-15T00:00:00Z'),
      durationYears: 20,
      method: 'Linéaire',
      closingDate: closing2025,
      degressiveCoefficient: 1.5,
    });
    expect(result.rate).toBeCloseTo(0.05, 5);
    expect(result.accumulatedDepreciation).toBe(8550308);
    expect(result.netBookValue).toBe(36449692);
    expect(result.annualDotation).toBe(2250000); // annuité pleine (acquis avant l'exercice N)
    expect(result.status).toBe('Actif');
  });

  it('IMM-004 Serveur Dell (dégressif, 3.5M, acquis 2024-01-20, 3 ans)', () => {
    const result = computeDepreciation({
      grossValue: 3500000,
      acquisitionDate: new Date('2024-01-20T00:00:00Z'),
      durationYears: 3,
      method: 'Dégressif',
      closingDate: closing2025,
      degressiveCoefficient: 1.5,
    });
    expect(result.accumulatedDepreciation).toBe(2274241);
    expect(result.netBookValue).toBe(1225759);
    expect(result.annualDotation).toBe(1195814);
    expect(result.status).toBe('Actif');
  });

  it('applique le prorata temporis pour un bien acquis pendant l\'exercice N', () => {
    const result = computeDepreciation({
      grossValue: 2400000,
      acquisitionDate: new Date('2025-08-20T00:00:00Z'),
      durationYears: 5,
      method: 'Linéaire',
      closingDate: closing2025,
      degressiveCoefficient: 1.5,
    });
    // Détenu du 20/08 au 31/12/2025 inclus = 134 jours
    const expectedDotation = Math.round(2400000 * (1 / 5) * (134 / 365.25));
    expect(result.annualDotation).toBe(expectedDotation);
  });

  it('un bien non amortissable (terrain) garde sa VNC = valeur brute et dotation nulle', () => {
    const result = computeDepreciation({
      grossValue: 20000000,
      acquisitionDate: new Date('2020-01-01T00:00:00Z'),
      durationYears: null,
      method: 'Non amortissable',
      closingDate: closing2025,
      degressiveCoefficient: 1.5,
    });
    expect(result.netBookValue).toBe(20000000);
    expect(result.annualDotation).toBe(0);
    expect(result.status).toBe('Non amortissable');
  });

  it('passe au statut "Amorti" quand la durée est atteinte ou la VNC nulle', () => {
    const result = computeDepreciation({
      grossValue: 1000000,
      acquisitionDate: new Date('2015-01-01T00:00:00Z'),
      durationYears: 5,
      method: 'Linéaire',
      closingDate: closing2025,
      degressiveCoefficient: 1.5,
    });
    expect(result.netBookValue).toBe(0);
    expect(result.status).toBe('Amorti');
  });

  it('la VNC ne devient jamais négative même très après la fin de durée', () => {
    const result = computeDepreciation({
      grossValue: 500000,
      acquisitionDate: new Date('2000-01-01T00:00:00Z'),
      durationYears: 3,
      method: 'Linéaire',
      closingDate: closing2025,
      degressiveCoefficient: 1.5,
    });
    expect(result.netBookValue).toBe(0);
    expect(result.accumulatedDepreciation).toBe(500000);
  });
});
