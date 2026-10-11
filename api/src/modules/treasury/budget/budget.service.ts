import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import {
  getMemberCompanyOrThrow,
  getOwnedCompanyOrThrow,
} from "@/modules/companies/companies.service";
import { UpsertBudgetLineInput } from "./budget.schemas";

export async function listBudgetLines(
  companyId: string,
  auth: AuthenticatedUser,
  fiscalYear: number,
) {
  await getMemberCompanyOrThrow(companyId, auth);
  return prisma.treasuryBudgetLine.findMany({
    where: { companyId, fiscalYear },
    orderBy: [{ type: "asc" }, { rubric: "asc" }, { month: "asc" }],
  });
}

/**
 * Le budget prévisionnel engage l'entreprise (paramètre de pilotage) : sa
 * modification reste réservée aux administrateurs, comme les paramètres et le
 * personnel — contrairement aux écritures du journal, ouvertes aux membres.
 */
export async function upsertBudgetLine(
  companyId: string,
  auth: AuthenticatedUser,
  input: UpsertBudgetLineInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return prisma.treasuryBudgetLine.upsert({
    where: {
      companyId_fiscalYear_rubric_type_month: {
        companyId,
        fiscalYear: input.fiscalYear,
        rubric: input.rubric,
        type: input.type,
        month: input.month,
      },
    },
    create: { ...input, companyId },
    update: { amount: input.amount },
  });
}

export async function deleteBudgetLine(id: string, auth: AuthenticatedUser) {
  const line = await prisma.treasuryBudgetLine.findUnique({ where: { id } });
  if (!line) throw AppError.notFound("Ligne de budget introuvable");
  await getOwnedCompanyOrThrow(line.companyId, auth);
  await prisma.treasuryBudgetLine.delete({ where: { id } });
}
