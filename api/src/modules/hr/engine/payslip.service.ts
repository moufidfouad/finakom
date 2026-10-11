import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedEmployeeOrThrow } from "@/modules/hr/employees/employees.service";
import { computePayroll, computeWorkedHours } from "./hrEngine";

export async function getPayslip(
  employeeId: string,
  auth: AuthenticatedUser,
  periodDate: Date,
) {
  const employee = await getOwnedEmployeeOrThrow(employeeId, auth);

  const [payroll, workedHours] = await Promise.all([
    prisma.payroll.findUnique({
      where: { employeeId_periodDate: { employeeId, periodDate } },
    }),
    prisma.workedHours.findUnique({
      where: { employeeId_periodDate: { employeeId, periodDate } },
    }),
  ]);

  if (!payroll) {
    throw AppError.notFound(
      "Aucun bulletin de paie enregistré pour cette période. Renseignez d'abord la paie du mois.",
    );
  }

  const contractualHours = workedHours
    ? Number(workedHours.contractualHours)
    : 0;
  const actualHours = workedHours
    ? Number(workedHours.actualHours)
    : contractualHours;
  const hoursCalc = computeWorkedHours(
    Number(payroll.grossSalary),
    contractualHours,
    actualHours,
  );
  const payrollCalc = computePayroll({
    grossSalary: Number(payroll.grossSalary),
    bonus: Number(payroll.bonus),
    latePenalty: Number(payroll.latePenalty),
    socialContribution: Number(payroll.socialContribution),
    overtimePay: hoursCalc.overtimePay,
  });

  return {
    employee: {
      code: employee.code,
      fullName: employee.fullName,
      position: employee.position,
      department: employee.department,
      contractType: employee.contractType,
      city: employee.city,
      hireDate: employee.hireDate,
    },
    period: periodDate,
    hours: hoursCalc,
    payroll: payrollCalc,
    paymentStatus: payroll.paymentStatus,
    paymentDate: payroll.paymentDate,
  };
}
