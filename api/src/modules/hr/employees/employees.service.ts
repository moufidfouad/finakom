import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { ownerWhereNested } from "@/utils/authContext";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { generateEmployeeCode } from "@/utils/codeGenerator";
import {
  buildOrgTree,
  wouldCreateCycle,
} from "@/modules/hr/engine/orgChartEngine";
import { computeLeaveBalance } from "@/modules/hr/engine/leaveBalanceEngine";
import { CreateEmployeeInput, UpdateEmployeeInput } from "./employees.schemas";

export async function getOwnedEmployeeOrThrow(
  employeeId: string,
  auth: AuthenticatedUser,
) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, ...ownerWhereNested(auth) },
    include: { company: true },
  });
  if (!employee) throw AppError.notFound("Employé introuvable");
  return employee;
}

export async function listEmployees(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return prisma.employee.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
  });
}

/** Valide qu'un manager proposé appartient bien à la même entreprise et ne
 * crée pas de cycle hiérarchique — appelé à la création ET à la modification. */
async function assertValidManager(
  companyId: string,
  employeeId: string | null,
  managerId: string | null | undefined,
) {
  if (!managerId) return;

  const manager = await prisma.employee.findFirst({
    where: { id: managerId, companyId },
  });
  if (!manager)
    throw AppError.badRequest(
      "Le manager sélectionné n'appartient pas à cette entreprise.",
    );

  const allLinks = await prisma.employee.findMany({
    where: { companyId },
    select: { id: true, managerId: true },
  });
  if (employeeId && wouldCreateCycle(employeeId, managerId, allLinks)) {
    throw AppError.badRequest(
      "Cette affectation créerait une boucle hiérarchique (un employé ne peut pas dépendre, même indirectement, de lui-même).",
    );
  }
}

export async function createEmployee(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateEmployeeInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  await assertValidManager(companyId, null, input.managerId);
  const code = await generateEmployeeCode(companyId);
  return prisma.employee.create({ data: { ...input, companyId, code } });
}

export async function getEmployee(employeeId: string, auth: AuthenticatedUser) {
  return getOwnedEmployeeOrThrow(employeeId, auth);
}

export async function updateEmployee(
  employeeId: string,
  auth: AuthenticatedUser,
  input: UpdateEmployeeInput,
) {
  const employee = await getOwnedEmployeeOrThrow(employeeId, auth);
  if (input.managerId !== undefined) {
    await assertValidManager(employee.companyId, employeeId, input.managerId);
  }
  return prisma.employee.update({ where: { id: employeeId }, data: input });
}

export async function deleteEmployee(
  employeeId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedEmployeeOrThrow(employeeId, auth);
  await prisma.employee.delete({ where: { id: employeeId } });
}

/** Organigramme complet de l'entreprise, sous forme d'arbre. */
export async function getOrgChart(companyId: string, auth: AuthenticatedUser) {
  await getOwnedCompanyOrThrow(companyId, auth);
  const employees = await prisma.employee.findMany({
    where: { companyId, status: "Actif" },
    select: { id: true, fullName: true, position: true, managerId: true },
  });
  return buildOrgTree(employees);
}

/** Solde de congés payés d'un employé à une date donnée (aujourd'hui par
 * défaut) — accumulation 2,5 jours/mois complet travaillé, déduction des
 * seuls jours de type "Congé annuel" déjà approuvés (les congés maladie,
 * maternité, sans solde... ne s'imputent pas sur ce solde). */
export async function getLeaveBalance(
  employeeId: string,
  auth: AuthenticatedUser,
  asOfDate: Date = new Date(),
) {
  const employee = await getOwnedEmployeeOrThrow(employeeId, auth);

  const approvedAnnualLeave = await prisma.leaveRequest.findMany({
    where: { employeeId, status: "Approuvé", leaveType: "Congé annuel" },
  });
  const takenDays = approvedAnnualLeave.reduce(
    (sum: number, l: (typeof approvedAnnualLeave)[number]) =>
      sum + l.numberOfDays,
    0,
  );

  return computeLeaveBalance({
    hireDate: employee.hireDate,
    asOfDate,
    takenDays,
  });
}
