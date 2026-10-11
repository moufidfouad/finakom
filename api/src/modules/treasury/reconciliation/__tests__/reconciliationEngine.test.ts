import { describe, expect, it } from 'vitest';
import { computeReconciliationGap, suggestMatches } from '../reconciliationEngine';

describe('suggestMatches', () => {
  it('propose une correspondance EXACTE (même montant, même jour)', () => {
    const matches = suggestMatches(
      [{ id: 'S1', date: new Date('2026-02-10'), amount: 500000 }],
      [{ id: 'E1', date: new Date('2026-02-10'), amount: 500000, type: 'Encaissement' }]
    );
    expect(matches).toEqual([{ statementLineId: 'S1', treasuryEntryId: 'E1', confidence: 'EXACT' }]);
  });

  it('propose une correspondance PROBABLE (même montant, écart de quelques jours dans la tolérance)', () => {
    const matches = suggestMatches(
      [{ id: 'S1', date: new Date('2026-02-12'), amount: 500000 }],
      [{ id: 'E1', date: new Date('2026-02-10'), amount: 500000, type: 'Encaissement' }],
      5
    );
    expect(matches[0].confidence).toBe('PROBABLE');
  });

  it("n'associe pas deux éléments si l'écart de date dépasse la tolérance", () => {
    const matches = suggestMatches(
      [{ id: 'S1', date: new Date('2026-02-20'), amount: 500000 }],
      [{ id: 'E1', date: new Date('2026-02-10'), amount: 500000, type: 'Encaissement' }],
      5
    );
    expect(matches).toHaveLength(0);
  });

  it('convertit correctement le signe : un Décaissement doit correspondre à un montant négatif du relevé', () => {
    const matches = suggestMatches(
      [{ id: 'S1', date: new Date('2026-02-10'), amount: -75000 }],
      [{ id: 'E1', date: new Date('2026-02-10'), amount: 75000, type: 'Décaissement' }]
    );
    expect(matches).toHaveLength(1);
  });

  it('ne propose jamais deux fois la même écriture pour deux lignes de relevé différentes', () => {
    const matches = suggestMatches(
      [
        { id: 'S1', date: new Date('2026-02-10'), amount: 500000 },
        { id: 'S2', date: new Date('2026-02-11'), amount: 500000 },
      ],
      [{ id: 'E1', date: new Date('2026-02-10'), amount: 500000, type: 'Encaissement' }]
    );
    expect(matches).toHaveLength(1); // une seule écriture disponible, une seule suggestion possible
  });

  it('préfère une correspondance EXACTE à une correspondance PROBABLE si les deux existent', () => {
    const matches = suggestMatches(
      [{ id: 'S1', date: new Date('2026-02-10'), amount: 500000 }],
      [
        { id: 'E1', date: new Date('2026-02-08'), amount: 500000, type: 'Encaissement' }, // probable
        { id: 'E2', date: new Date('2026-02-10'), amount: 500000, type: 'Encaissement' }, // exact
      ],
      5
    );
    expect(matches[0].treasuryEntryId).toBe('E2');
    expect(matches[0].confidence).toBe('EXACT');
  });
});

describe('computeReconciliationGap', () => {
  it('calcule un rapprochement parfait (aucun écart) — cas vérifié à la main', () => {
    // Solde comptable 1300 = trois écritures : +1000 (rapprochée), +500 (rapprochée), -200 (NON rapprochée)
    // Relevé bancaire 1450 = deux lignes rapprochées (+1000, +500) + une ligne NON rapprochée (-50, frais bancaire pas encore saisi)
    const result = computeReconciliationGap({
      bookBalance: 1300,
      bankStatementBalance: 1450,
      unmatchedStatementLines: [{ amount: -50 }],
      unreconciledBookEntries: [{ amount: 200, type: 'Décaissement' }],
    });
    expect(result.expectedBankBalance).toBe(1450);
    expect(result.gap).toBe(0);
    expect(result.isReconciled).toBe(true);
  });

  it('détecte un écart résiduel (erreur de saisie ou rapprochement incomplet)', () => {
    const result = computeReconciliationGap({
      bookBalance: 1300,
      bankStatementBalance: 1500, // 50 de plus que ce qui est expliqué
      unmatchedStatementLines: [{ amount: -50 }],
      unreconciledBookEntries: [{ amount: 200, type: 'Décaissement' }],
    });
    expect(result.gap).toBe(50);
    expect(result.isReconciled).toBe(false);
  });

  it('fonctionne sans aucun élément en circulation (rapprochement total)', () => {
    const result = computeReconciliationGap({
      bookBalance: 1000,
      bankStatementBalance: 1000,
      unmatchedStatementLines: [],
      unreconciledBookEntries: [],
    });
    expect(result.isReconciled).toBe(true);
  });

  it('gère correctement les arrondis (évite les faux écarts de type 0.1+0.2)', () => {
    const result = computeReconciliationGap({
      bookBalance: 100.1,
      bankStatementBalance: 100.1,
      unmatchedStatementLines: [{ amount: 0.3 }, { amount: 0.3 }],
      unreconciledBookEntries: [{ amount: 0.6, type: 'Encaissement' }],
    });
    expect(result.isReconciled).toBe(true);
  });
});
