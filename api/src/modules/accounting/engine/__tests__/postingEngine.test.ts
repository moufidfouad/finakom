import { describe, expect, it } from 'vitest';
import { buildCreditNoteEntryLines, buildDepreciationEntryLines, buildPayrollEntryLines, buildPaymentEntryLines, buildPurchaseEntryLines, buildSaleEntryLines, buildSupplierPaymentEntryLines } from '../postingEngine';
import { checkEntryBalance } from '../ledgerEngine';

function toBalanceCheckInput(lines: { debit: number; credit: number }[]) {
  return lines.map((l, i) => ({ accountNumber: `role-${i}`, debit: l.debit, credit: l.credit }));
}

describe('buildSaleEntryLines — écriture de vente toujours équilibrée', () => {
  it('génère Clients(débit TTC) / Ventes(crédit HT) / TVA collectée(crédit TVA)', () => {
    const lines = buildSaleEntryLines({ totalHT: 100000, totalTVA: 18000, totalTTC: 118000 });
    expect(lines).toEqual([
      { role: 'CLIENTS', debit: 118000, credit: 0 },
      { role: 'VENTES_MARCHANDISES', debit: 0, credit: 100000 },
      { role: 'TVA_COLLECTEE', debit: 0, credit: 18000 },
    ]);
    expect(checkEntryBalance(toBalanceCheckInput(lines)).isBalanced).toBe(true);
  });

  it('utilise le rôle VENTES_SERVICES quand isService est vrai', () => {
    const lines = buildSaleEntryLines({ totalHT: 50000, totalTVA: 9000, totalTTC: 59000, isService: true });
    expect(lines.find((l) => l.role === 'VENTES_SERVICES')).toBeTruthy();
    expect(lines.find((l) => l.role === 'VENTES_MARCHANDISES')).toBeUndefined();
  });

  it('omet la ligne TVA si la vente est exonérée (TVA nulle) sans casser l\'équilibre', () => {
    const lines = buildSaleEntryLines({ totalHT: 100000, totalTVA: 0, totalTTC: 100000 });
    expect(lines).toHaveLength(2);
    expect(checkEntryBalance(toBalanceCheckInput(lines)).isBalanced).toBe(true);
  });
});

describe('buildPaymentEntryLines — écriture d\'encaissement toujours équilibrée', () => {
  it('génère Banque(débit) / Clients(crédit) pour un règlement bancaire', () => {
    const lines = buildPaymentEntryLines({ amount: 50000, toBank: true });
    expect(lines).toEqual([
      { role: 'BANQUE', debit: 50000, credit: 0 },
      { role: 'CLIENTS', debit: 0, credit: 50000 },
    ]);
    expect(checkEntryBalance(toBalanceCheckInput(lines)).isBalanced).toBe(true);
  });

  it('utilise Caisse plutôt que Banque quand toBank est faux', () => {
    const lines = buildPaymentEntryLines({ amount: 20000, toBank: false });
    expect(lines[0].role).toBe('CAISSE');
  });
});

describe('buildPayrollEntryLines — écriture de paie toujours équilibrée', () => {
  it('génère Charges personnel(débit brut) / Organismes sociaux(crédit cotisations) / Personnel(crédit net)', () => {
    const lines = buildPayrollEntryLines({ totalGross: 290000, socialContribution: 22500, netSalary: 267500 });
    expect(checkEntryBalance(toBalanceCheckInput(lines)).isBalanced).toBe(true);
    expect(lines.find((l) => l.role === 'CHARGES_PERSONNEL')?.debit).toBe(290000);
    expect(lines.find((l) => l.role === 'PERSONNEL_REMUNERATIONS_DUES')?.credit).toBe(267500);
    expect(lines.find((l) => l.role === 'ORGANISMES_SOCIAUX')?.credit).toBe(22500);
  });
});

describe('buildDepreciationEntryLines — écriture de dotation toujours équilibrée', () => {
  it('génère Dotations(débit) / Amortissements cumulés(crédit) à montant égal', () => {
    const lines = buildDepreciationEntryLines({ annualDotation: 2250000 });
    expect(checkEntryBalance(toBalanceCheckInput(lines)).isBalanced).toBe(true);
    expect(lines[0].debit).toBe(2250000);
    expect(lines[1].credit).toBe(2250000);
  });
});

describe('buildPurchaseEntryLines — écriture d\'achat toujours équilibrée (symétrique des ventes)', () => {
  it('génère Achats(débit HT) / TVA déductible(débit TVA) / Fournisseurs(crédit TTC)', () => {
    const lines = buildPurchaseEntryLines({ totalHT: 100000, totalTVA: 18000, totalTTC: 118000 });
    expect(lines).toEqual([
      { role: 'ACHATS', debit: 100000, credit: 0 },
      { role: 'TVA_DEDUCTIBLE', debit: 18000, credit: 0 },
      { role: 'FOURNISSEURS', debit: 0, credit: 118000 },
    ]);
    expect(checkEntryBalance(toBalanceCheckInput(lines)).isBalanced).toBe(true);
  });

  it('omet la ligne TVA si l\'achat est exonéré, sans casser l\'équilibre', () => {
    const lines = buildPurchaseEntryLines({ totalHT: 100000, totalTVA: 0, totalTTC: 100000 });
    expect(lines).toHaveLength(2);
    expect(checkEntryBalance(toBalanceCheckInput(lines)).isBalanced).toBe(true);
  });
});

describe('buildSupplierPaymentEntryLines — écriture de règlement fournisseur toujours équilibrée', () => {
  it('génère Fournisseurs(débit) / Banque(crédit) pour un règlement bancaire', () => {
    const lines = buildSupplierPaymentEntryLines({ amount: 50000, toBank: true });
    expect(lines).toEqual([
      { role: 'FOURNISSEURS', debit: 50000, credit: 0 },
      { role: 'BANQUE', debit: 0, credit: 50000 },
    ]);
    expect(checkEntryBalance(toBalanceCheckInput(lines)).isBalanced).toBe(true);
  });

  it('utilise Caisse plutôt que Banque quand toBank est faux', () => {
    const lines = buildSupplierPaymentEntryLines({ amount: 20000, toBank: false });
    expect(lines[1].role).toBe('CAISSE');
  });
});

describe('buildCreditNoteEntryLines — écriture d\'avoir toujours équilibrée (inverse exacte de la vente)', () => {
  it('génère Ventes(débit HT) / TVA collectée(débit TVA) / Clients(crédit TTC)', () => {
    const lines = buildCreditNoteEntryLines({ totalHT: 100000, totalTVA: 18000, totalTTC: 118000 });
    expect(lines).toEqual([
      { role: 'VENTES_MARCHANDISES', debit: 100000, credit: 0 },
      { role: 'TVA_COLLECTEE', debit: 18000, credit: 0 },
      { role: 'CLIENTS', debit: 0, credit: 118000 },
    ]);
    expect(checkEntryBalance(toBalanceCheckInput(lines)).isBalanced).toBe(true);
  });

  it('est exactement la symétrie inverse de buildSaleEntryLines pour les mêmes montants', () => {
    const sale = buildSaleEntryLines({ totalHT: 50000, totalTVA: 9000, totalTTC: 59000 });
    const creditNote = buildCreditNoteEntryLines({ totalHT: 50000, totalTVA: 9000, totalTTC: 59000 });
    // Chaque ligne de vente doit avoir son débit/crédit inversés dans l'avoir, pour le même rôle
    for (const saleLine of sale) {
      const mirrored = creditNote.find((l) => l.role === saleLine.role);
      expect(mirrored).toBeDefined();
      expect(mirrored!.debit).toBe(saleLine.credit);
      expect(mirrored!.credit).toBe(saleLine.debit);
    }
  });

  it('utilise le rôle VENTES_SERVICES quand isService est vrai', () => {
    const lines = buildCreditNoteEntryLines({ totalHT: 30000, totalTVA: 5400, totalTTC: 35400, isService: true });
    expect(lines.find((l) => l.role === 'VENTES_SERVICES')).toBeTruthy();
  });

  it('omet la ligne TVA si l\'avoir est exonéré, sans casser l\'équilibre', () => {
    const lines = buildCreditNoteEntryLines({ totalHT: 40000, totalTVA: 0, totalTTC: 40000 });
    expect(lines).toHaveLength(2);
    expect(checkEntryBalance(toBalanceCheckInput(lines)).isBalanced).toBe(true);
  });
});
