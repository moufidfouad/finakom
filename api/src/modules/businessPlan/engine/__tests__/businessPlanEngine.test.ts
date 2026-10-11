import { describe, expect, it } from 'vitest';
import {
  computeBalanceYear,
  computeFinancialHealthAppreciation,
  computeInvestmentFundingSummary,
  computePLYear,
  computeProfitabilityMessage,
} from '../businessPlanEngine';

describe('Business plan — Investissement & financement', () => {
  it('calcule le solde de financement et le statut de couverture', () => {
    const summary = computeInvestmentFundingSummary([3000000, 1500000, 500000], [3000000, 2000000]);
    expect(summary.totalInvestment).toBe(5000000);
    expect(summary.totalFunding).toBe(5000000);
    expect(summary.balance).toBe(0);
    expect(summary.isFullyFunded).toBe(true);
  });

  it('détecte un financement insuffisant', () => {
    const summary = computeInvestmentFundingSummary([5000000], [3000000]);
    expect(summary.balance).toBe(-2000000);
    expect(summary.isFullyFunded).toBe(false);
  });
});

describe('Business plan — Compte de résultat (cascade CA → EBE → résultat net)', () => {
  const lines = [
    { section: 'ChiffreAffaires' as const, amount: 12000000 },
    { section: 'ChargesVariables' as const, amount: 4500000 },
    { section: 'ChargesFixes' as const, amount: 2800000 },
    { section: 'ChargesPersonnel' as const, amount: 3200000 },
    { section: 'ImpotsTaxes' as const, amount: 150000 },
    { section: 'ChargesFinancieres' as const, amount: 200000 },
    { section: 'ImpotSocietes' as const, amount: 300000 },
  ];

  it('calcule la marge brute, l\'EBE, le résultat avant impôts et le résultat net exactement comme le classeur', () => {
    const result = computePLYear(lines);
    expect(result.margeBrute).toBe(7500000);
    expect(result.excedentBrutExploitation).toBe(1500000);
    expect(result.resultatAvantImpots).toBe(1150000);
    expect(result.resultatNet).toBe(850000);
  });

  it('calcule le seuil de rentabilité (formule M12 : CF / (1 - CV/CA))', () => {
    const result = computePLYear(lines);
    expect(result.seuilDeRentabilite).toBeCloseTo(4480000, 0);
  });

  it('calcule le taux de marge brute et la marge nette', () => {
    const result = computePLYear(lines);
    expect(result.tauxMargeBrute).toBeCloseTo(0.625, 5);
    expect(result.margeNette).toBeCloseTo(0.07083, 4);
  });

  it("retourne null pour les ratios quand le chiffre d'affaires est nul (division par zéro évitée)", () => {
    const result = computePLYear([{ section: 'ChargesFixes', amount: 100000 }]);
    expect(result.tauxMargeBrute).toBeNull();
    expect(result.margeNette).toBeNull();
    expect(result.seuilDeRentabilite).toBeNull();
  });

  it('affiche le message de rentabilité selon le signe du résultat net', () => {
    const positive = computePLYear(lines);
    expect(computeProfitabilityMessage(positive, 'année 3')).toContain('✅');
    const negative = computePLYear([{ section: 'ChargesFixes', amount: 500000 }]);
    expect(computeProfitabilityMessage(negative, 'année 3')).toContain('❌');
  });
});

describe('Business plan — Bilan prévisionnel & indicateurs', () => {
  it('assemble le total actif/passif à partir des lignes saisies + résultat net + trésorerie du plan', () => {
    const lines = [
      { side: 'Actif' as const, category: 'Immobilisations corporelles', amount: 2000000 },
      { side: 'Actif' as const, category: 'Stocks', amount: 500000 },
      { side: 'Actif' as const, category: 'Créances clients', amount: 1800000 },
      { side: 'Actif' as const, category: 'Créance TVA', amount: 100000 },
      { side: 'Passif' as const, category: 'Apport personnel', amount: 3000000 },
      { side: 'Passif' as const, category: 'Emprunts', amount: 2000000 },
      { side: 'Passif' as const, category: 'Dettes fournisseurs', amount: 800000 },
      { side: 'Passif' as const, category: 'Dettes fiscales et sociales', amount: 200000 },
    ];
    const result = computeBalanceYear(lines, 850000, 900000);
    expect(result.totalActif).toBe(5300000); // 2M+500k+1.8M+100k + trésorerie 900k
    expect(result.totalPassif).toBe(6850000); // 3M+2M+800k+200k + résultat net 850k
    expect(result.bfr).toBe(1400000); // (500k+1.8M+100k) - (800k+200k)
    expect(result.tresorerieNette).toBe(-500000); // 900k - BFR 1.4M
    expect(result.tauxEndettement).toBeCloseTo(0.43796, 4);
    expect(result.autonomieFinanciere).toBeCloseTo(0.56204, 4);
  });

  it('détecte un bilan équilibré (actif = passif, tolérance 1)', () => {
    const lines = [
      { side: 'Actif' as const, category: 'Immobilisations corporelles', amount: 1000000 },
      { side: 'Passif' as const, category: 'Apport personnel', amount: 1000000 },
    ];
    const result = computeBalanceYear(lines, 0, 0);
    expect(result.isEquilibre).toBe(true);
  });

  it('détecte un bilan déséquilibré', () => {
    const lines = [
      { side: 'Actif' as const, category: 'Immobilisations corporelles', amount: 1000000 },
      { side: 'Passif' as const, category: 'Apport personnel', amount: 700000 },
    ];
    const result = computeBalanceYear(lines, 0, 0);
    expect(result.isEquilibre).toBe(false);
  });

  it('donne une appréciation favorable quand trésorerie/endettement/autonomie sont sains en moyenne', () => {
    const appreciation = computeFinancialHealthAppreciation([
      { totalActif: 0, totalPassif: 0, bfr: 0, tresorerieNette: 500000, tauxEndettement: 0.4, autonomieFinanciere: 0.5, isEquilibre: true },
      { totalActif: 0, totalPassif: 0, bfr: 0, tresorerieNette: 700000, tauxEndettement: 0.3, autonomieFinanciere: 0.6, isEquilibre: true },
    ]);
    expect(appreciation.level).toBe('bon');
  });

  it('donne une appréciation fragile quand la trésorerie moyenne est négative', () => {
    const appreciation = computeFinancialHealthAppreciation([
      { totalActif: 0, totalPassif: 0, bfr: 0, tresorerieNette: -200000, tauxEndettement: 0.5, autonomieFinanciere: 0.4, isEquilibre: true },
    ]);
    expect(appreciation.level).toBe('fragile');
  });
});
