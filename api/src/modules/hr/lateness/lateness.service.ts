import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { isSuperAdmin } from "@/utils/authContext";
import { getOwnedEmployeeOrThrow } from "@/modules/hr/employees/employees.service";
import { CreateLatenessInput } from "./lateness.schemas";

export async function listLateness(
  employeeId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedEmployeeOrThrow(employeeId, auth);
  return prisma.latenessRecord.findMany({
    where: { employeeId },
    orderBy: { date: "desc" },
  });
}
export async function createLateness(
  employeeId: string,
  auth: AuthenticatedUser,
  input: CreateLatenessInput,
) {
  await getOwnedEmployeeOrThrow(employeeId, auth);
  return prisma.latenessRecord.create({ data: { ...input, employeeId } });
}
export async function deleteLateness(id: string, auth: AuthenticatedUser) {
  const record = await prisma.latenessRecord.findUnique({
    where: { id },
    include: { employee: { include: { company: true } } },
  });
  if (
    !record ||
    (!isSuperAdmin(auth.role) && record.employee.company.userId !== auth.userId)
  ) {
    throw AppError.notFound("Enregistrement introuvable");
  }
  await prisma.latenessRecord.delete({ where: { id } });
}
