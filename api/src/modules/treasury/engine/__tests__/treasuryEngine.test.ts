import { describe, expect, it } from 'vitest';
import { buildMonthlySchedule, computeCashPosition, computeSignal, withRunningBalance } from '../treasuryEngine';

// Reproduit fidèlement les 7 premières écritures réelles du "JOURNAL ENCAISS-DECAISS"
// du classeur (solde initial banque 3 500 000, solde initial caisse 500 000).
const journalSample = [
  { date: new Date('2025-01-05'), type: 'Encaissement' as const, amount: 3588750, support: 'Banque', category: 'Règlements clients' },
  { date: new Date('2025-01-08'), type: 'Décaissement' as const, amount: 2392500, support: 'Banque', category: 'Achats fournisseurs' },
  { date: new Date('2025-01-15'), type: 'Décaissement' as const, amount: 714300, support: 'Banque', category: 'Salaires & charges sociales' },
  { date: new Date('2025-01-15'), type: 'Décaissement' as const, amount: 136400, support: 'Banque', category: 'CNPS versé' },
  { date: new Date('2025-01-20'), type: 'Encaissement' as const, amount: 485625, support: 'Orange Money', category: 'Ventes comptant' },
  { date: new Date('2025-01-25'), type: 'Décaissement' as const, amount: 15000, support: 'Banque', category: 'Frais généraux' },
  { date: new Date('2025-01-31'), type: 'Décaissement' as const, amount: 192500, support: 'Banque', category: 'TVA versée DGI' },
];

describe('Moteur trésorerie — position de caisse', () => {
  it('calcule les soldes banque/mobile et caisse séparément (formules I3/K3 du journal)', () => {
    const position = computeCashPosition(journalSample, 500000, 3500000);
    // Banque + Mobile Money : 3 500 000 + 3 588 750 - 2 392 500 - 714 300 - 136 400 + 485 625 - 15 000 - 192 500
    expect(position.bankBalance).toBe(4123675);
    expect(position.cashBalance).toBe(500000); // aucun mouvement sur "Caisse" dans cet échantillon
    expect(position.totalBalance).toBe(4623675);
  });

  it('calcule le flux net (encaissé - décaissé)', () => {
    const position = computeCashPosition(journalSample, 0, 0);
    expect(position.totalInflow).toBe(3588750 + 485625);
    expect(position.totalOutflow).toBe(2392500 + 714300 + 136400 + 15000 + 192500);
    expect(position.netFlow).toBe(position.totalInflow - position.totalOutflow);
  });
});

describe('Moteur trésorerie — solde cumulé chronologique', () => {
  it('calcule un solde cumulé croissant/décroissant selon chaque écriture, dans l\'ordre des dates', () => {
    const withBalance = withRunningBalance(journalSample, 4000000); // solde initial global 500k+3.5M
    expect(withBalance[0].runningBalance).toBe(4000000 + 3588750);
    expect(withBalance).toHaveLength(7);
    // Le solde final doit correspondre au solde initial + flux net total
    const last = withBalance[withBalance.length - 1];
    const netFlow = journalSample.reduce((s, m) => s + (m.type === 'Encaissement' ? m.amount : -m.amount), 0);
    expect(last.runningBalance).toBe(4000000 + netFlow);
  });
});

describe('Moteur trésorerie — signal d\'alerte', () => {
  it('déclenche CRITIQUE sous le seuil critique, ALERTE sous le seuil d\'alerte, OK sinon', () => {
    expect(computeSignal(200000, 1000000, 300000)).toBe('CRITIQUE');
    expect(computeSignal(500000, 1000000, 300000)).toBe('ALERTE');
    expect(computeSignal(1500000, 1000000, 300000)).toBe('OK');
  });
});

describe('Moteur trésorerie — planning mensuel prévisionnel', () => {
  it('cumule le solde mois après mois (lignes 28/30/31 du budget prévisionnel)', () => {
    const schedule = buildMonthlySchedule(
      [
        { month: 1, type: 'Encaissement', amount: 4500000 },
        { month: 1, type: 'Décaissement', amount: 3370000 },
        { month: 2, type: 'Encaissement', amount: 3700000 },
        { month: 2, type: 'Décaissement', amount: 3170000 },
      ],
      4000000,
      1000000,
      300000
    );
    expect(schedule[0].closingBalance).toBe(4000000 + (4500000 - 3370000));
    expect(schedule[1].openingBalance).toBe(schedule[0].closingBalance);
    expect(schedule[1].closingBalance).toBe(schedule[0].closingBalance + (3700000 - 3170000));
    // Mois sans écriture (mars..déc) : flux net nul, solde inchangé
    expect(schedule[2].netFlow).toBe(0);
    expect(schedule[2].closingBalance).toBe(schedule[1].closingBalance);
    expect(schedule).toHaveLength(12);
  });
});
