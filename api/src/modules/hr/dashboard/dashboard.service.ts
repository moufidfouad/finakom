import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { DashboardIndicators } from "@/modules/hr/engine/hrEngine";

export async function getHrDashboard(
  companyId: string,
  auth: AuthenticatedUser,
  periodDate: Date,
): Promise<DashboardIndicators> {
  await getOwnedCompanyOrThrow(companyId, auth);

  const employees = await prisma.employee.findMany({ where: { companyId } });
  const activeEmployees = employees.filter(
    (e: (typeof employees)[number]) => e.status === "Actif",
  );
  const employeeIds = employees.map((e: (typeof employees)[number]) => e.id);

  const [payrolls, workedHours, attendanceRecords, latenessRecords] =
    await Promise.all([
      prisma.payroll.findMany({
        where: { employeeId: { in: employeeIds }, periodDate },
      }),
      prisma.workedHours.findMany({
        where: { employeeId: { in: employeeIds }, periodDate },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          employeeId: { in: employeeIds },
          date: { gte: startOfMonth(periodDate), lte: endOfMonth(periodDate) },
        },
      }),
      prisma.latenessRecord.findMany({
        where: {
          employeeId: { in: employeeIds },
          date: { gte: startOfMonth(periodDate), lte: endOfMonth(periodDate) },
        },
      }),
    ]);

  const grossPayrollMass = activeEmployees.reduce(
    (t: number, e: (typeof employees)[number]) => t + Number(e.grossSalary),
    0,
  );
  const netPayrollMass = payrollsNetSum(payrolls);

  const totalOvertimeHours = workedHours.reduce(
    (t: number, w: (typeof workedHours)[number]) => {
      const overtime = Number(w.actualHours) - Number(w.contractualHours);
      return overtime > 0 ? t + overtime : t;
    },
    0,
  );

  const unjustifiedAbsences = attendanceRecords.filter(
    (a: (typeof attendanceRecords)[number]) =>
      a.status === "Absence injustifiée",
  ).length;
  const absenteeismRate =
    attendanceRecords.length > 0
      ? unjustifiedAbsences / attendanceRecords.length
      : null;

  const contractBreakdown: Record<string, number> = {};
  const genderBreakdown: Record<string, number> = {};
  for (const e of employees) {
    contractBreakdown[e.contractType] =
      (contractBreakdown[e.contractType] ?? 0) + 1;
    genderBreakdown[e.gender] = (genderBreakdown[e.gender] ?? 0) + 1;
  }

  return {
    activeEmployeeCount: activeEmployees.length,
    grossPayrollMass,
    netPayrollMass,
    absenteeismRate,
    latenessCount: latenessRecords.length,
    totalOvertimeHours,
    contractBreakdown,
    genderBreakdown,
  };
}

function payrollsNetSum(
  payrolls: {
    grossSalary: unknown;
    bonus: unknown;
    latePenalty: unknown;
    socialContribution: unknown;
  }[],
) {
  return payrolls.reduce(
    (total, p) =>
      total +
      (Number(p.grossSalary) +
        Number(p.bonus) -
        Number(p.latePenalty) -
        Number(p.socialContribution)),
    0,
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
