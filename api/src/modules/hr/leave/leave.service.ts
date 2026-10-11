import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { isSuperAdmin } from "@/utils/authContext";
import { getOwnedEmployeeOrThrow } from "@/modules/hr/employees/employees.service";
import { CreateLeaveInput } from "./leave.schemas";

export async function listLeave(employeeId: string, auth: AuthenticatedUser) {
  await getOwnedEmployeeOrThrow(employeeId, auth);
  return prisma.leaveRequest.findMany({
    where: { employeeId },
    orderBy: { startDate: "desc" },
  });
}
export async function createLeave(
  employeeId: string,
  auth: AuthenticatedUser,
  input: CreateLeaveInput,
) {
  await getOwnedEmployeeOrThrow(employeeId, auth);
  return prisma.leaveRequest.create({ data: { ...input, employeeId } });
}
export async function updateLeaveStatus(
  id: string,
  auth: AuthenticatedUser,
  status: string,
) {
  const record = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: { include: { company: true } } },
  });
  if (
    !record ||
    (!isSuperAdmin(auth.role) && record.employee.company.userId !== auth.userId)
  ) {
    throw AppError.notFound("Demande de congé introuvable");
  }
  return prisma.leaveRequest.update({ where: { id }, data: { status } });
}
export async function deleteLeave(id: string, auth: AuthenticatedUser) {
  const record = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { employee: { include: { company: true } } },
  });
  if (
    !record ||
    (!isSuperAdmin(auth.role) && record.employee.company.userId !== auth.userId)
  ) {
    throw AppError.notFound("Demande de congé introuvable");
  }
  await prisma.leaveRequest.delete({ where: { id } });
}
