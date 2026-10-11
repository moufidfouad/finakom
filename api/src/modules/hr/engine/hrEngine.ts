export interface WorkedHoursCalc {
  contractualHours: number;
  actualHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimePay: number;
  status: "Heures sup" | "Déficit heures" | "Normal";
}

export function computeWorkedHours(
  grossSalary: number,
  contractualHours: number,
  actualHours: number,
): WorkedHoursCalc {
  const overtimeHours = actualHours - contractualHours;
  const hourlyRate = contractualHours > 0 ? grossSalary / contractualHours : 0;
  const overtimePay = overtimeHours > 0 ? overtimeHours * hourlyRate * 1.25 : 0;
  const status =
    overtimeHours > 5
      ? "Heures sup"
      : overtimeHours < -5
        ? "Déficit heures"
        : "Normal";
  return {
    contractualHours,
    actualHours,
    overtimeHours,
    hourlyRate,
    overtimePay,
    status,
  };
}

export interface PayrollCalc {
  grossSalary: number;
  bonus: number;
  latePenalty: number;
  socialContribution: number;
  overtimePay: number;
  totalGross: number;
  netSalary: number;
}

export function computePayroll(params: {
  grossSalary: number;
  bonus: number;
  latePenalty: number;
  socialContribution: number;
  overtimePay?: number;
}): PayrollCalc {
  const overtimePay = params.overtimePay ?? 0;
  const totalGross = params.grossSalary + params.bonus + overtimePay;
  const netSalary = totalGross - params.latePenalty - params.socialContribution;
  return {
    grossSalary: params.grossSalary,
    bonus: params.bonus,
    latePenalty: params.latePenalty,
    socialContribution: params.socialContribution,
    overtimePay,
    totalGross,
    netSalary,
  };
}

export interface DashboardIndicators {
  activeEmployeeCount: number;
  grossPayrollMass: number;
  netPayrollMass: number;
  absenteeismRate: number | null;
  latenessCount: number;
  totalOvertimeHours: number;
  contractBreakdown: Record<string, number>;
  genderBreakdown: Record<string, number>;
}
