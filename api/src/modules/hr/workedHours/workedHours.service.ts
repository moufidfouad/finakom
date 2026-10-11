import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { isSuperAdmin } from "@/utils/authContext";
import { getOwnedEmployeeOrThrow } from "@/modules/hr/employees/employees.service";
import { UpsertWorkedHoursInput } from "./workedHours.schemas";

export async function listWorkedHours(
  employeeId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedEmployeeOrThrow(employeeId, auth);
  return prisma.workedHours.findMany({
    where: { employeeId },
    orderBy: { periodDate: "desc" },
  });
}
export async function upsertWorkedHours(
  employeeId: string,
  auth: AuthenticatedUser,
  input: UpsertWorkedHoursInput,
) {
  await getOwnedEmployeeOrThrow(employeeId, auth);
  return prisma.workedHours.upsert({
    where: {
      employeeId_periodDate: { employeeId, periodDate: input.periodDate },
    },
    create: { ...input, employeeId },
    update: {
      contractualHours: input.contractualHours,
      actualHours: input.actualHours,
    },
  });
}
export async function deleteWorkedHours(id: string, auth: AuthenticatedUser) {
  const record = await prisma.workedHours.findUnique({
    where: { id },
    include: { employee: { include: { company: true } } },
  });
  if (
    !record ||
    (!isSuperAdmin(auth.role) && record.employee.company.userId !== auth.userId)
  ) {
    throw AppError.notFound("Enregistrement introuvable");
  }
  await prisma.workedHours.delete({ where: { id } });
}
