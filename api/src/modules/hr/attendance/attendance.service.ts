import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { isSuperAdmin } from "@/utils/authContext";
import { getOwnedEmployeeOrThrow } from "@/modules/hr/employees/employees.service";
import { CreateAttendanceInput } from "./attendance.schemas";

export async function listAttendance(
  employeeId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedEmployeeOrThrow(employeeId, auth);
  return prisma.attendanceRecord.findMany({
    where: { employeeId },
    orderBy: { date: "desc" },
  });
}
export async function createAttendance(
  employeeId: string,
  auth: AuthenticatedUser,
  input: CreateAttendanceInput,
) {
  await getOwnedEmployeeOrThrow(employeeId, auth);
  return prisma.attendanceRecord.create({ data: { ...input, employeeId } });
}
export async function deleteAttendance(id: string, auth: AuthenticatedUser) {
  const record = await prisma.attendanceRecord.findUnique({
    where: { id },
    include: { employee: { include: { company: true } } },
  });
  if (
    !record ||
    (!isSuperAdmin(auth.role) && record.employee.company.userId !== auth.userId)
  ) {
    throw AppError.notFound("Enregistrement introuvable");
  }
  await prisma.attendanceRecord.delete({ where: { id } });
}
