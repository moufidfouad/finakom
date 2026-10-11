import { describe, expect, it } from 'vitest';
import { groupIndicatorsByCurrency } from '../groupDashboardEngine';

describe('groupIndicatorsByCurrency', () => {
  it('additionne correctement plusieurs entreprises de la même devise', () => {
    const groups = groupIndicatorsByCurrency([
      { companyId: 'C1', companyName: 'A', currency: 'KMF', cashBalance: 1000000, revenueYTD: 5000000, activeEmployeeCount: 3 },
      { companyId: 'C2', companyName: 'B', currency: 'KMF', cashBalance: 500000, revenueYTD: 2000000, activeEmployeeCount: 2 },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].totalCashBalance).toBe(1500000);
    expect(groups[0].totalRevenueYTD).toBe(7000000);
    expect(groups[0].totalActiveEmployeeCount).toBe(5);
  });

  it('CRITIQUE : ne mélange jamais deux devises différentes dans un même total', () => {
    const groups = groupIndicatorsByCurrency([
      { companyId: 'C1', companyName: 'Comorienne', currency: 'KMF', cashBalance: 1000000, revenueYTD: 5000000, activeEmployeeCount: 3 },
      { companyId: 'C2', companyName: 'Ivoirienne', currency: 'XOF', cashBalance: 800000, revenueYTD: 3000000, activeEmployeeCount: 4 },
    ]);
    expect(groups).toHaveLength(2); // jamais un seul groupe fusionné
    const kmf = groups.find((g) => g.currency === 'KMF');
    const xof = groups.find((g) => g.currency === 'XOF');
    expect(kmf?.totalCashBalance).toBe(1000000); // pas 1 800 000
    expect(xof?.totalCashBalance).toBe(800000);
    expect(kmf?.companies).toHaveLength(1);
    expect(xof?.companies).toHaveLength(1);
  });

  it('trie les groupes par trésorerie totale décroissante', () => {
    const groups = groupIndicatorsByCurrency([
      { companyId: 'C1', companyName: 'A', currency: 'KMF', cashBalance: 100, revenueYTD: 0, activeEmployeeCount: 0 },
      { companyId: 'C2', companyName: 'B', currency: 'XOF', cashBalance: 999999, revenueYTD: 0, activeEmployeeCount: 0 },
    ]);
    expect(groups[0].currency).toBe('XOF');
  });

  it('gère une liste vide sans planter', () => {
    expect(groupIndicatorsByCurrency([])).toEqual([]);
  });

  it('gère correctement les arrondis (évite les faux totaux de type 0.1+0.2)', () => {
    const groups = groupIndicatorsByCurrency([
      { companyId: 'C1', companyName: 'A', currency: 'KMF', cashBalance: 100.1, revenueYTD: 0, activeEmployeeCount: 0 },
      { companyId: 'C2', companyName: 'B', currency: 'KMF', cashBalance: 200.2, revenueYTD: 0, activeEmployeeCount: 0 },
    ]);
    expect(groups[0].totalCashBalance).toBe(300.3);
  });
});
