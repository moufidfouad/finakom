import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import {
  getOwnedBusinessPlanOrThrow,
  assertCanModifyBusinessPlan,
} from "@/modules/businessPlan/plan/plan.service";
import { CreatePLLineInput, UpdatePLLineInput } from "./plLines.schemas";

export async function listPLLines(planId: string, auth: AuthenticatedUser) {
  await getOwnedBusinessPlanOrThrow(planId, auth);
  return prisma.businessPlanPLLine.findMany({
    where: { businessPlanId: planId },
    orderBy: [{ year: "asc" }, { section: "asc" }],
  });
}

export async function createPLLine(
  planId: string,
  auth: AuthenticatedUser,
  input: CreatePLLineInput,
) {
  const plan = await getOwnedBusinessPlanOrThrow(planId, auth);
  await assertCanModifyBusinessPlan(plan, auth);
  return prisma.businessPlanPLLine.create({
    data: { ...input, businessPlanId: planId },
  });
}

async function getOwnedPLLineOrThrow(id: string, auth: AuthenticatedUser) {
  const item = await prisma.businessPlanPLLine.findUnique({
    where: { id },
    include: { businessPlan: true },
  });
  if (!item) throw AppError.notFound("Ligne introuvable");
  await getOwnedBusinessPlanOrThrow(item.businessPlanId, auth);
  return item;
}

export async function updatePLLine(
  id: string,
  auth: AuthenticatedUser,
  input: UpdatePLLineInput,
) {
  const item = await getOwnedPLLineOrThrow(id, auth);
  await assertCanModifyBusinessPlan(item.businessPlan, auth);
  return prisma.businessPlanPLLine.update({ where: { id }, data: input });
}

export async function deletePLLine(id: string, auth: AuthenticatedUser) {
  const item = await getOwnedPLLineOrThrow(id, auth);
  await assertCanModifyBusinessPlan(item.businessPlan, auth);
  await prisma.businessPlanPLLine.delete({ where: { id } });
}
