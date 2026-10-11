import { describe, expect, it } from 'vitest';
import { buildAgingReport, InvoiceForAging } from '../collectionsEngine';

const REF_DATE = new Date('2026-06-01');

function invoiceDaysAgo(days: number, overrides: Partial<InvoiceForAging> = {}): InvoiceForAging {
  const date = new Date(REF_DATE.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    invoiceId: `inv-${days}`, invoiceNumber: `FAC-${days}`, clientId: 'client-1', clientName: 'Client Test',
    date, status: 'Impayée', remaining: 100000, ...overrides,
  };
}

describe('buildAgingReport — tranches (vérifiées aux limites exactes)', () => {
  it('classe une facture à 30 jours pile en 0-30', () => {
    const report = buildAgingReport([invoiceDaysAgo(30)], REF_DATE);
    expect(report.lines[0].bucket).toBe('0-30');
  });

  it('classe une facture à 31 jours en 31-60 (juste après la limite précédente)', () => {
    const report = buildAgingReport([invoiceDaysAgo(31)], REF_DATE);
    expect(report.lines[0].bucket).toBe('31-60');
  });

  it('classe une facture à 60 jours pile en 31-60', () => {
    const report = buildAgingReport([invoiceDaysAgo(60)], REF_DATE);
    expect(report.lines[0].bucket).toBe('31-60');
  });

  it('classe une facture à 90 jours pile en 61-90, PAS en 90+', () => {
    const report = buildAgingReport([invoiceDaysAgo(90)], REF_DATE);
    expect(report.lines[0].bucket).toBe('61-90');
  });

  it('classe une facture à 91 jours en 90+', () => {
    const report = buildAgingReport([invoiceDaysAgo(91)], REF_DATE);
    expect(report.lines[0].bucket).toBe('90+');
  });

  it('exclut les factures déjà payées', () => {
    const report = buildAgingReport([invoiceDaysAgo(120, { status: 'Payée', remaining: 0 })], REF_DATE);
    expect(report.lines).toHaveLength(0);
  });

  it('exclut une facture au statut Impayée mais dont le reste dû est à 0 (garde-fou de cohérence)', () => {
    const report = buildAgingReport([invoiceDaysAgo(45, { remaining: 0 })], REF_DATE);
    expect(report.lines).toHaveLength(0);
  });
});

describe('buildAgingReport — agrégation par client et niveau de risque', () => {
  it('un client à 90 jours pile est ALERTE, pas CRITIQUE (cohérence avec la limite du bucket 90+)', () => {
    const report = buildAgingReport([invoiceDaysAgo(90)], REF_DATE);
    expect(report.byClient[0].riskLevel).toBe('ALERTE');
  });

  it('un client à 91 jours devient CRITIQUE', () => {
    const report = buildAgingReport([invoiceDaysAgo(91)], REF_DATE);
    expect(report.byClient[0].riskLevel).toBe('CRITIQUE');
  });

  it('un client à 60 jours pile reste OK (pas encore ALERTE)', () => {
    const report = buildAgingReport([invoiceDaysAgo(60)], REF_DATE);
    expect(report.byClient[0].riskLevel).toBe('OK');
  });

  it('le niveau de risque du client suit sa facture LA PLUS ANCIENNE, pas son encours total', () => {
    const report = buildAgingReport(
      [
        invoiceDaysAgo(95, { invoiceId: 'old', invoiceNumber: 'FAC-OLD', remaining: 1000 }), // petite mais très ancienne
        invoiceDaysAgo(5, { invoiceId: 'new', invoiceNumber: 'FAC-NEW', remaining: 900000 }), // grosse mais récente
      ],
      REF_DATE
    );
    expect(report.byClient[0].riskLevel).toBe('CRITIQUE'); // gouverné par la facture à 95j, pas par le gros montant récent
    expect(report.byClient[0].totalOutstanding).toBe(901000);
  });

  it('agrège correctement plusieurs factures du même client dans le bon panier', () => {
    const report = buildAgingReport(
      [
        invoiceDaysAgo(10, { invoiceId: 'a', invoiceNumber: 'FAC-A', remaining: 50000 }),
        invoiceDaysAgo(15, { invoiceId: 'b', invoiceNumber: 'FAC-B', remaining: 30000 }),
      ],
      REF_DATE
    );
    expect(report.byClient).toHaveLength(1);
    expect(report.byClient[0].invoiceCount).toBe(2);
    expect(report.byClient[0].bucketTotals['0-30']).toBe(80000);
  });

  it('trie les clients du plus à risque (le plus ancien impayé) au moins à risque', () => {
    const report = buildAgingReport(
      [
        invoiceDaysAgo(10, { invoiceId: 'a', clientId: 'client-recent', clientName: 'Récent' }),
        invoiceDaysAgo(100, { invoiceId: 'b', clientId: 'client-vieux', clientName: 'Ancien' }),
      ],
      REF_DATE
    );
    expect(report.byClient[0].clientId).toBe('client-vieux');
    expect(report.byClient[1].clientId).toBe('client-recent');
  });

  it('les totaux globaux (bucketTotals, totalOutstanding) correspondent à la somme des lignes', () => {
    const report = buildAgingReport(
      [
        invoiceDaysAgo(10, { invoiceId: 'a', remaining: 50000 }),
        invoiceDaysAgo(70, { invoiceId: 'b', remaining: 30000, clientId: 'client-2', clientName: 'Autre client' }),
      ],
      REF_DATE
    );
    expect(report.totalOutstanding).toBe(80000);
    expect(report.bucketTotals['0-30']).toBe(50000);
    expect(report.bucketTotals['61-90']).toBe(30000);
  });
});
