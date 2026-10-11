import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import {
  getOwnedBusinessPlanOrThrow,
  assertCanModifyBusinessPlan,
} from "@/modules/businessPlan/plan/plan.service";
import {
  CreateInvestmentInput,
  UpdateInvestmentInput,
} from "./investments.schemas";

export async function listInvestments(planId: string, auth: AuthenticatedUser) {
  await getOwnedBusinessPlanOrThrow(planId, auth);
  return prisma.businessPlanInvestment.findMany({
    where: { businessPlanId: planId },
    orderBy: { category: "asc" },
  });
}

export async function createInvestment(
  planId: string,
  auth: AuthenticatedUser,
  input: CreateInvestmentInput,
) {
  const plan = await getOwnedBusinessPlanOrThrow(planId, auth);
  await assertCanModifyBusinessPlan(plan, auth);
  return prisma.businessPlanInvestment.create({
    data: { ...input, businessPlanId: planId },
  });
}

async function getOwnedInvestmentOrThrow(id: string, auth: AuthenticatedUser) {
  const item = await prisma.businessPlanInvestment.findUnique({
    where: { id },
    include: { businessPlan: true },
  });
  if (!item) throw AppError.notFound("Ligne introuvable");
  await getOwnedBusinessPlanOrThrow(item.businessPlanId, auth); // vérifie l'accès en lecture
  return item;
}

export async function updateInvestment(
  id: string,
  auth: AuthenticatedUser,
  input: UpdateInvestmentInput,
) {
  const item = await getOwnedInvestmentOrThrow(id, auth);
  await assertCanModifyBusinessPlan(item.businessPlan, auth);
  return prisma.businessPlanInvestment.update({ where: { id }, data: input });
}

export async function deleteInvestment(id: string, auth: AuthenticatedUser) {
  const item = await getOwnedInvestmentOrThrow(id, auth);
  await assertCanModifyBusinessPlan(item.businessPlan, auth);
  await prisma.businessPlanInvestment.delete({ where: { id } });
}
