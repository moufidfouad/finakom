import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import {
  getOwnedBusinessPlanOrThrow,
  assertCanModifyBusinessPlan,
} from "@/modules/businessPlan/plan/plan.service";
import { CreateFundingInput, UpdateFundingInput } from "./fundings.schemas";

export async function listFundings(planId: string, auth: AuthenticatedUser) {
  await getOwnedBusinessPlanOrThrow(planId, auth);
  return prisma.businessPlanFunding.findMany({
    where: { businessPlanId: planId },
    orderBy: { type: "asc" },
  });
}

export async function createFunding(
  planId: string,
  auth: AuthenticatedUser,
  input: CreateFundingInput,
) {
  const plan = await getOwnedBusinessPlanOrThrow(planId, auth);
  await assertCanModifyBusinessPlan(plan, auth);
  return prisma.businessPlanFunding.create({
    data: { ...input, businessPlanId: planId },
  });
}

async function getOwnedFundingOrThrow(id: string, auth: AuthenticatedUser) {
  const item = await prisma.businessPlanFunding.findUnique({
    where: { id },
    include: { businessPlan: true },
  });
  if (!item) throw AppError.notFound("Ligne introuvable");
  await getOwnedBusinessPlanOrThrow(item.businessPlanId, auth);
  return item;
}

export async function updateFunding(
  id: string,
  auth: AuthenticatedUser,
  input: UpdateFundingInput,
) {
  const item = await getOwnedFundingOrThrow(id, auth);
  await assertCanModifyBusinessPlan(item.businessPlan, auth);
  return prisma.businessPlanFunding.update({ where: { id }, data: input });
}

export async function deleteFunding(id: string, auth: AuthenticatedUser) {
  const item = await getOwnedFundingOrThrow(id, auth);
  await assertCanModifyBusinessPlan(item.businessPlan, auth);
  await prisma.businessPlanFunding.delete({ where: { id } });
}
