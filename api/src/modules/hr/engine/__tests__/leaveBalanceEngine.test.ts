import { describe, expect, it } from 'vitest';
import { computeLeaveBalance } from '../leaveBalanceEngine';

describe('computeLeaveBalance', () => {
  it('calcule 0 mois si la date de calcul précède la date d\'embauche', () => {
    const result = computeLeaveBalance({ hireDate: new Date('2026-06-01'), asOfDate: new Date('2026-01-01'), takenDays: 0 });
    expect(result.monthsWorked).toBe(0);
    expect(result.accruedDays).toBe(0);
  });

  it('compte un mois complet le jour anniversaire exact (embauché le 15/01, au 15/02)', () => {
    const result = computeLeaveBalance({ hireDate: new Date('2026-01-15'), asOfDate: new Date('2026-02-15'), takenDays: 0 });
    expect(result.monthsWorked).toBe(1);
    expect(result.accruedDays).toBe(2.5);
  });

  it('ne compte PAS le mois entamé la veille de l\'anniversaire (embauché le 15/01, au 14/02)', () => {
    const result = computeLeaveBalance({ hireDate: new Date('2026-01-15'), asOfDate: new Date('2026-02-14'), takenDays: 0 });
    expect(result.monthsWorked).toBe(0);
  });

  it('cas vérifié à la main : embauché le 15/01, calcul au 10/03 -> exactement 1 mois complet (le second mois n\'a pas atteint son anniversaire)', () => {
    const result = computeLeaveBalance({ hireDate: new Date('2026-01-15'), asOfDate: new Date('2026-03-10'), takenDays: 0 });
    expect(result.monthsWorked).toBe(1);
  });

  it('déduit correctement les jours déjà pris du solde accumulé', () => {
    const result = computeLeaveBalance({ hireDate: new Date('2026-01-01'), asOfDate: new Date('2026-07-01'), takenDays: 5 });
    expect(result.monthsWorked).toBe(6);
    expect(result.accruedDays).toBe(15); // 6 × 2.5
    expect(result.balanceDays).toBe(10); // 15 - 5
  });

  it('autorise un solde négatif si l\'employé a pris plus de jours que le solde accumulé (congé anticipé)', () => {
    const result = computeLeaveBalance({ hireDate: new Date('2026-01-01'), asOfDate: new Date('2026-02-01'), takenDays: 10 });
    expect(result.balanceDays).toBe(-7.5); // 2.5 - 10
  });

  it('accepte un taux d\'accumulation personnalisé', () => {
    const result = computeLeaveBalance({ hireDate: new Date('2026-01-01'), asOfDate: new Date('2026-02-01'), takenDays: 0, accrualDaysPerMonth: 2 });
    expect(result.accruedDays).toBe(2);
  });

  it('gère correctement une ancienneté de plusieurs années (12 mois × 3 ans = 36 mois)', () => {
    const result = computeLeaveBalance({ hireDate: new Date('2023-01-01'), asOfDate: new Date('2026-01-01'), takenDays: 0 });
    expect(result.monthsWorked).toBe(36);
    expect(result.accruedDays).toBe(90); // 36 × 2.5
  });
});
