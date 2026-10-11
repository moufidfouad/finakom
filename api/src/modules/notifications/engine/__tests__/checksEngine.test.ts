import { describe, expect, it } from 'vitest';
import { checkExpiringContracts, checkLowStock, checkOverdueInvoices, checkTreasuryThreshold } from '../checksEngine';

describe('checkTreasuryThreshold', () => {
  it("retourne null si le solde est au-dessus des deux seuils", () => {
    expect(checkTreasuryThreshold(1000000, 500000, 200000)).toBeNull();
  });
  it("retourne une alerte 'ALERTE' entre les deux seuils", () => {
    const alert = checkTreasuryThreshold(300000, 500000, 200000);
    expect(alert?.severity).toBe('ALERTE');
  });
  it("retourne une alerte 'CRITIQUE' sous le seuil critique", () => {
    const alert = checkTreasuryThreshold(100000, 500000, 200000);
    expect(alert?.severity).toBe('CRITIQUE');
  });
  it('gère correctement les valeurs exactement sur un seuil (strictement inférieur, pas égal)', () => {
    expect(checkTreasuryThreshold(500000, 500000, 200000)).toBeNull();
    expect(checkTreasuryThreshold(200000, 500000, 200000)?.severity).toBe('ALERTE');
  });
});

describe('checkOverdueInvoices', () => {
  const referenceDate = new Date('2026-03-01');

  it('ignore les factures payées, même anciennes', () => {
    const alerts = checkOverdueInvoices(
      [{ number: 'FAC-001', date: new Date('2025-01-01'), status: 'Payée', totalTTC: 100000, remaining: 0 }],
      referenceDate
    );
    expect(alerts).toHaveLength(0);
  });

  it('ignore une facture impayée récente (dans le délai de courtoisie)', () => {
    const alerts = checkOverdueInvoices(
      [{ number: 'FAC-002', date: new Date('2026-02-20'), status: 'Impayée', totalTTC: 50000, remaining: 50000 }],
      referenceDate,
      30
    );
    expect(alerts).toHaveLength(0);
  });

  it('signale en ALERTE une facture impayée juste au-delà du délai', () => {
    const alerts = checkOverdueInvoices(
      [{ number: 'FAC-003', date: new Date('2026-01-25'), status: 'Impayée', totalTTC: 50000, remaining: 50000 }],
      referenceDate,
      30
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('ALERTE');
  });

  it('signale en CRITIQUE une facture impayée depuis le double du délai', () => {
    const alerts = checkOverdueInvoices(
      [{ number: 'FAC-004', date: new Date('2025-11-01'), status: 'Impayée', totalTTC: 50000, remaining: 50000 }],
      referenceDate,
      30
    );
    expect(alerts[0].severity).toBe('CRITIQUE');
  });

  it('signale aussi une facture "Partielle" en retard', () => {
    const alerts = checkOverdueInvoices(
      [{ number: 'FAC-005', date: new Date('2026-01-01'), status: 'Partielle', totalTTC: 100000, remaining: 40000 }],
      referenceDate,
      30
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain('partiellement');
  });
});

describe('checkLowStock', () => {
  it('ignore les produits sans alerte (niveau 2 = OK)', () => {
    const alerts = checkLowStock([{ code: 'ART-001', designation: 'Riz', alertLevel: 2, stockFinal: 100, stockMin: 10 }]);
    expect(alerts).toHaveLength(0);
  });
  it('signale en ALERTE un produit sous le seuil (niveau 1)', () => {
    const alerts = checkLowStock([{ code: 'ART-002', designation: 'Huile', alertLevel: 1, stockFinal: 5, stockMin: 10 }]);
    expect(alerts[0].severity).toBe('ALERTE');
  });
  it('signale en CRITIQUE une rupture de stock (niveau 0)', () => {
    const alerts = checkLowStock([{ code: 'ART-003', designation: 'Sucre', alertLevel: 0, stockFinal: 0, stockMin: 10 }]);
    expect(alerts[0].severity).toBe('CRITIQUE');
    expect(alerts[0].message).toContain('Rupture');
  });
});

describe('checkExpiringContracts', () => {
  const referenceDate = new Date('2026-03-01');

  it('ignore les contrats CDI (aucune date de fin pertinente)', () => {
    const alerts = checkExpiringContracts(
      [{ code: 'EMP-001', fullName: 'Ahmed Mohamed', contractType: 'CDI', contractEndDate: null }],
      referenceDate
    );
    expect(alerts).toHaveLength(0);
  });

  it('ignore un CDD dont la fin est encore lointaine', () => {
    const alerts = checkExpiringContracts(
      [{ code: 'EMP-002', fullName: 'Halima Saïd', contractType: 'CDD', contractEndDate: new Date('2026-06-01') }],
      referenceDate,
      30
    );
    expect(alerts).toHaveLength(0);
  });

  it('signale en ALERTE un CDD arrivant à échéance dans la fenêtre', () => {
    const alerts = checkExpiringContracts(
      [{ code: 'EMP-003', fullName: 'Youssouf Bacar', contractType: 'CDD', contractEndDate: new Date('2026-03-20') }],
      referenceDate,
      30
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('ALERTE');
  });

  it('signale en CRITIQUE un CDD arrivant à échéance sous 7 jours', () => {
    const alerts = checkExpiringContracts(
      [{ code: 'EMP-004', fullName: 'Ali Youssouf', contractType: 'CDD', contractEndDate: new Date('2026-03-05') }],
      referenceDate,
      30
    );
    expect(alerts[0].severity).toBe('CRITIQUE');
  });

  it('ignore un CDD déjà expiré (date de fin dans le passé)', () => {
    const alerts = checkExpiringContracts(
      [{ code: 'EMP-005', fullName: 'Test Expiré', contractType: 'CDD', contractEndDate: new Date('2026-02-01') }],
      referenceDate,
      30
    );
    expect(alerts).toHaveLength(0);
  });
});
