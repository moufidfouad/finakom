import { describe, expect, it } from 'vitest';
import { buildFullReport } from '../buildReport';
import { RawBalanceLine } from '../engine.types';

const balanceSheetOnly: RawBalanceLine[] = [
  { accountNumber: '101000', label: 'Capital social', debitN: 0, creditN: 5000000, debitN1: 0, creditN1: 5000000 },
  { accountNumber: '121000', label: 'Réserves & résultats antérieurs', debitN: 0, creditN: 2450000, debitN1: 0, creditN1: 1660000 },
  { accountNumber: '162000', label: 'Emprunts', debitN: 0, creditN: 2000000, debitN1: 0, creditN1: 2500000 },
  { accountNumber: '221000', label: 'Bâtiments (valeur nette)', debitN: 4500000, creditN: 0, debitN1: 5000000, creditN1: 0 },
  { accountNumber: '311000', label: 'Stocks marchandises', debitN: 1200000, creditN: 0, debitN1: 900000, creditN1: 0 },
  { accountNumber: '411000', label: 'Clients', debitN: 1800000, creditN: 0, debitN1: 1500000, creditN1: 0 },
  { accountNumber: '401000', label: 'Fournisseurs', debitN: 0, creditN: 1400000, debitN1: 0, creditN1: 1100000 },
  { accountNumber: '571000', label: 'Caisse', debitN: 100000, creditN: 0, debitN1: 50000, creditN1: 0 },
  { accountNumber: '521000', label: 'Banque', debitN: 3250000, creditN: 0, debitN1: 2810000, creditN1: 0 },
];

const withActivity: RawBalanceLine[] = [
  { accountNumber: '702000', label: 'Ventes de produits', debitN: 0, creditN: 12000000, debitN1: 0, creditN1: 10000000 },
  { accountNumber: '602000', label: 'Achats matières', debitN: 5000000, creditN: 0, debitN1: 4200000, creditN1: 0 },
  { accountNumber: '624000', label: 'Transports', debitN: 300000, creditN: 0, debitN1: 250000, creditN1: 0 },
  { accountNumber: '622000', label: 'Locations', debitN: 800000, creditN: 0, debitN1: 700000, creditN1: 0 },
  { accountNumber: '661000', label: 'Salaires', debitN: 3000000, creditN: 0, debitN1: 2700000, creditN1: 0 },
  { accountNumber: '641000', label: 'Impôts et taxes', debitN: 150000, creditN: 0, debitN1: 120000, creditN1: 0 },
  { accountNumber: '681100', label: 'Dotations amort.', debitN: 500000, creditN: 0, debitN1: 450000, creditN1: 0 },
  { accountNumber: '671000', label: 'Intérêts', debitN: 200000, creditN: 0, debitN1: 220000, creditN1: 0 },
  { accountNumber: '891000', label: 'IS', debitN: 400000, creditN: 0, debitN1: 300000, creditN1: 0 },
];

describe('Moteur de calcul SYSCOHADA — Contrôles & Bilan', () => {
  it("valide l'équilibre débit/crédit sur une balance de bilan cohérente", () => {
    const report = buildFullReport(balanceSheetOnly);
    expect(report.controles.ecartDebitCredit.equilibre).toBe(true);
  });

  it("valide l'équilibre actif/passif sur une balance de bilan cohérente", () => {
    const report = buildFullReport(balanceSheetOnly);
    expect(report.controles.ecartActifPassif.equilibre).toBe(true);
  });

  it("respecte l'identité comptable FR - BFR - TN = 0", () => {
    const report = buildFullReport(balanceSheetOnly);
    expect(Math.abs(report.bilan.equilibreFonctionnel.controle.n)).toBeLessThan(1);
    expect(Math.abs(report.bilan.equilibreFonctionnel.controle.n1)).toBeLessThan(1);
  });

  it('calcule une note de santé financière comprise entre 0 et 20', () => {
    const report = buildFullReport(balanceSheetOnly);
    expect(report.synthese.noteSante.noteGlobale).toBeGreaterThanOrEqual(0);
    expect(report.synthese.noteSante.noteGlobale).toBeLessThanOrEqual(20);
  });
});

describe('Moteur de calcul SYSCOHADA — Cascade SIG', () => {
  it("calcule le chiffre d'affaires", () => {
    const report = buildFullReport(withActivity);
    expect(report.resultat.chiffreAffaires.n).toBe(12000000);
  });

  it('calcule le résultat net en cascade', () => {
    const report = buildFullReport(withActivity);
    expect(report.resultat.resultatNet.n).toBe(1650000);
  });
});
