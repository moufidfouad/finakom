import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import {
  getOwnedBusinessPlanOrThrow,
  assertCanModifyBusinessPlan,
} from "@/modules/businessPlan/plan/plan.service";
import {
  CreateCashflowLineInput,
  UpdateCashflowLineInput,
} from "./cashflow.schemas";

export async function listCashflowLines(
  planId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedBusinessPlanOrThrow(planId, auth);
  return prisma.businessPlanCashflowLine.findMany({
    where: { businessPlanId: planId },
    orderBy: [{ month: "asc" }, { type: "asc" }],
  });
}

export async function createCashflowLine(
  planId: string,
  auth: AuthenticatedUser,
  input: CreateCashflowLineInput,
) {
  const plan = await getOwnedBusinessPlanOrThrow(planId, auth);
  await assertCanModifyBusinessPlan(plan, auth);
  return prisma.businessPlanCashflowLine.create({
    data: { ...input, businessPlanId: planId },
  });
}

async function getOwnedCashflowLineOrThrow(
  id: string,
  auth: AuthenticatedUser,
) {
  const item = await prisma.businessPlanCashflowLine.findUnique({
    where: { id },
    include: { businessPlan: true },
  });
  if (!item) throw AppError.notFound("Ligne introuvable");
  await getOwnedBusinessPlanOrThrow(item.businessPlanId, auth);
  return item;
}

export async function updateCashflowLine(
  id: string,
  auth: AuthenticatedUser,
  input: UpdateCashflowLineInput,
) {
  const item = await getOwnedCashflowLineOrThrow(id, auth);
  await assertCanModifyBusinessPlan(item.businessPlan, auth);
  return prisma.businessPlanCashflowLine.update({ where: { id }, data: input });
}

export async function deleteCashflowLine(id: string, auth: AuthenticatedUser) {
  const item = await getOwnedCashflowLineOrThrow(id, auth);
  await assertCanModifyBusinessPlan(item.businessPlan, auth);
  await prisma.businessPlanCashflowLine.delete({ where: { id } });
}
