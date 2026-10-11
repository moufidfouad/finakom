import { prisma } from "@/config/prisma";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedEmployeeOrThrow } from "@/modules/hr/employees/employees.service";
import { recordAuditLog } from "@/modules/auditLog/auditLog.service";
import { CreateAmendmentInput } from "./contractAmendments.schemas";

export async function listAmendments(
  employeeId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedEmployeeOrThrow(employeeId, auth);
  return prisma.contractAmendment.findMany({
    where: { employeeId },
    include: {
      createdBy: { select: { id: true, email: true, fullName: true } },
    },
    orderBy: { effectiveDate: "desc" },
  });
}

/**
 * Crée l'avenant ET applique le changement à la fiche employé, dans une même
 * transaction — les valeurs "avant" sont lues automatiquement depuis l'état
 * courant de l'employé (l'utilisateur ne saisit que ce qui change, jamais de
 * ressaisie de l'existant). Seuls les champs effectivement fournis dans
 * l'avenant sont modifiés ; les autres champs de la fiche employé restent intacts.
 */
export async function createAmendment(
  employeeId: string,
  auth: AuthenticatedUser,
  input: CreateAmendmentInput,
) {
  const employee = await getOwnedEmployeeOrThrow(employeeId, auth);

  const amendment = await prisma.$transaction(async (tx) => {
    const created = await tx.contractAmendment.create({
      data: {
        employeeId,
        effectiveDate: input.effectiveDate,
        reason: input.reason,
        notes: input.notes,
        createdById: auth.userId,
        ...(input.newPosition
          ? {
              previousPosition: employee.position,
              newPosition: input.newPosition,
            }
          : {}),
        ...(input.newDepartment
          ? {
              previousDepartment: employee.department,
              newDepartment: input.newDepartment,
            }
          : {}),
        ...(input.newGrossSalary !== undefined
          ? {
              previousGrossSalary: employee.grossSalary,
              newGrossSalary: input.newGrossSalary,
            }
          : {}),
        ...(input.newContractType
          ? {
              previousContractType: employee.contractType,
              newContractType: input.newContractType,
            }
          : {}),
      },
      include: {
        createdBy: { select: { id: true, email: true, fullName: true } },
      },
    });

    await tx.employee.update({
      where: { id: employeeId },
      data: {
        ...(input.newPosition ? { position: input.newPosition } : {}),
        ...(input.newDepartment ? { department: input.newDepartment } : {}),
        ...(input.newGrossSalary !== undefined
          ? { grossSalary: input.newGrossSalary }
          : {}),
        ...(input.newContractType
          ? { contractType: input.newContractType }
          : {}),
      },
    });

    return created;
  });

  const changesSummary = [
    input.newPosition &&
      `poste : "${employee.position}" → "${input.newPosition}"`,
    input.newDepartment &&
      `département : "${employee.department}" → "${input.newDepartment}"`,
    input.newGrossSalary !== undefined &&
      `salaire : ${Number(employee.grossSalary).toLocaleString("fr-FR")} → ${input.newGrossSalary.toLocaleString("fr-FR")}`,
    input.newContractType &&
      `contrat : "${employee.contractType}" → "${input.newContractType}"`,
  ]
    .filter(Boolean)
    .join(", ");

  await recordAuditLog({
    companyId: employee.companyId,
    userId: auth.userId,
    action: "UPDATE",
    entityType: "ContractAmendment",
    entityId: amendment.id,
    entityLabel: `Avenant — ${employee.fullName}`,
    summary: `${input.reason} : ${changesSummary}`,
  });

  return amendment;
}
