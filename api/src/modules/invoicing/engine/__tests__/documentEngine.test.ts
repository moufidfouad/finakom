import { describe, expect, it } from 'vitest';
import {
  computeDocumentTotals,
  computePaymentSummary,
  formatDocumentNumber,
} from '../documentEngine';

describe('Moteur de facturation — Totaux de document', () => {
  it('calcule HT/TVA/TTC comme le classeur Excel (TVA 18%)', () => {
    // Devis CLI-001 : Ordinateur (450 000) + Onduleur (42 000) x qtés variées
    const lines = [
      { quantity: 2, unitPriceHT: 450000 }, // 900 000
      { quantity: 1, unitPriceHT: 280000 }, // 280 000
    ];
    const totals = computeDocumentTotals(lines, 18);
    expect(totals.totalHT).toBe(1180000);
    expect(totals.totalTVA).toBeCloseTo(212400, 2);
    expect(totals.totalTTC).toBeCloseTo(1392400, 2);
  });

  it('gère une liste de lignes vide (aucune ligne saisie)', () => {
    const totals = computeDocumentTotals([], 18);
    expect(totals.totalHT).toBe(0);
    expect(totals.totalTTC).toBe(0);
  });
});

describe('Moteur de facturation — Suivi des paiements', () => {
  it('calcule le statut "Payée" quand le montant payé couvre le TTC (FAC-2025-001)', () => {
    const summary = computePaymentSummary(1180000, [1180000]);
    expect(summary.remaining).toBe(0);
    expect(summary.status).toBe('Payée');
  });

  it('calcule le statut "Partielle" avec un acompte de 50% (FAC-2025-002)', () => {
    const summary = computePaymentSummary(885000, [442500]);
    expect(summary.remaining).toBe(442500);
    expect(summary.percentPaid).toBeCloseTo(0.5, 5);
    expect(summary.status).toBe('Partielle');
  });

  it('calcule le statut "Impayée" en absence de paiement (FAC-2025-003)', () => {
    const summary = computePaymentSummary(560000, []);
    expect(summary.remaining).toBe(560000);
    expect(summary.status).toBe('Impayée');
  });

  it('cumule plusieurs paiements partiels', () => {
    const summary = computePaymentSummary(1000000, [300000, 300000, 400000]);
    expect(summary.totalPaid).toBe(1000000);
    expect(summary.status).toBe('Payée');
  });
});

describe('Moteur de facturation — Numérotation des documents', () => {
  it('formate le numéro comme dans le registre (DEV-2025-001)', () => {
    expect(formatDocumentNumber('DEV', 2025, 1)).toBe('DEV-2025-001');
    expect(formatDocumentNumber('FAC', 2025, 12)).toBe('FAC-2025-012');
    expect(formatDocumentNumber('BL', 2025, 137)).toBe('BL-2025-137');
  });
});
