import { describe, expect, it } from 'vitest';
import { computePayroll, computeWorkedHours } from '../hrEngine';

describe('Moteur RH — Heures travaillées & heures supplémentaires', () => {
  it('reproduit le calcul EMP001 du classeur Excel', () => {
    const result = computeWorkedHours(350000, 173, 180);
    expect(result.overtimeHours).toBe(7);
    expect(result.hourlyRate).toBeCloseTo(2023.12, 1);
    expect(result.overtimePay).toBeCloseTo(17702, 0);
    expect(result.status).toBe('Heures sup');
  });

  it('détecte un statut "Déficit heures"', () => {
    const result = computeWorkedHours(240000, 173, 155);
    expect(result.overtimeHours).toBe(-18);
    expect(result.status).toBe('Déficit heures');
  });

  it("ne calcule pas d'heures supplémentaires en cas de déficit", () => {
    const result = computeWorkedHours(240000, 173, 165);
    expect(result.overtimeHours).toBeLessThan(0);
    expect(result.overtimePay).toBe(0);
  });
});

describe('Moteur RH — Calcul du bulletin de paie', () => {
  it('calcule le salaire net = brut + prime + heures sup - retenues - cotisations', () => {
    const payroll = computePayroll({ grossSalary: 350000, bonus: 35000, latePenalty: 0, socialContribution: 42000, overtimePay: 17702 });
    expect(payroll.totalGross).toBe(350000 + 35000 + 17702);
    expect(payroll.netSalary).toBe(payroll.totalGross - 42000);
  });

  it('applique la retenue de retard avant le calcul du net', () => {
    const payroll = computePayroll({ grossSalary: 240000, bonus: 0, latePenalty: 9600, socialContribution: 28800 });
    expect(payroll.netSalary).toBe(201600);
  });
});
