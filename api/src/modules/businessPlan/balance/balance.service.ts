import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import {
  getOwnedBusinessPlanOrThrow,
  assertCanModifyBusinessPlan,
} from "@/modules/businessPlan/plan/plan.service";
import {
  CreateBalanceLineInput,
  UpdateBalanceLineInput,
} from "./balance.schemas";

export async function listBalanceLines(
  planId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedBusinessPlanOrThrow(planId, auth);
  return prisma.businessPlanBalanceLine.findMany({
    where: { businessPlanId: planId },
    orderBy: [{ year: "asc" }, { side: "asc" }],
  });
}

export async function createBalanceLine(
  planId: string,
  auth: AuthenticatedUser,
  input: CreateBalanceLineInput,
) {
  const plan = await getOwnedBusinessPlanOrThrow(planId, auth);
  await assertCanModifyBusinessPlan(plan, auth);
  return prisma.businessPlanBalanceLine.create({
    data: { ...input, businessPlanId: planId },
  });
}

async function getOwnedBalanceLineOrThrow(id: string, auth: AuthenticatedUser) {
  const item = await prisma.businessPlanBalanceLine.findUnique({
    where: { id },
    include: { businessPlan: true },
  });
  if (!item) throw AppError.notFound("Ligne introuvable");
  await getOwnedBusinessPlanOrThrow(item.businessPlanId, auth);
  return item;
}

export async function updateBalanceLine(
  id: string,
  auth: AuthenticatedUser,
  input: UpdateBalanceLineInput,
) {
  const item = await getOwnedBalanceLineOrThrow(id, auth);
  await assertCanModifyBusinessPlan(item.businessPlan, auth);
  return prisma.businessPlanBalanceLine.update({ where: { id }, data: input });
}

export async function deleteBalanceLine(id: string, auth: AuthenticatedUser) {
  const item = await getOwnedBalanceLineOrThrow(id, auth);
  await assertCanModifyBusinessPlan(item.businessPlan, auth);
  await prisma.businessPlanBalanceLine.delete({ where: { id } });
}
