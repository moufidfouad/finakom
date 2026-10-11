import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import {
  getOwnedBusinessPlanOrThrow,
  assertCanModifyBusinessPlan,
} from "@/modules/businessPlan/plan/plan.service";
import { CreateSupplierInput, UpdateSupplierInput } from "./suppliers.schemas";

export async function listSuppliers(planId: string, auth: AuthenticatedUser) {
  await getOwnedBusinessPlanOrThrow(planId, auth);
  return prisma.businessPlanSupplier.findMany({
    where: { businessPlanId: planId },
    orderBy: { name: "asc" },
  });
}

export async function createSupplier(
  planId: string,
  auth: AuthenticatedUser,
  input: CreateSupplierInput,
) {
  const plan = await getOwnedBusinessPlanOrThrow(planId, auth);
  await assertCanModifyBusinessPlan(plan, auth);
  return prisma.businessPlanSupplier.create({
    data: { ...input, businessPlanId: planId },
  });
}

async function getOwnedSupplierOrThrow(id: string, auth: AuthenticatedUser) {
  const item = await prisma.businessPlanSupplier.findUnique({
    where: { id },
    include: { businessPlan: true },
  });
  if (!item) throw AppError.notFound("Fournisseur introuvable");
  await getOwnedBusinessPlanOrThrow(item.businessPlanId, auth);
  return item;
}

export async function updateSupplier(
  id: string,
  auth: AuthenticatedUser,
  input: UpdateSupplierInput,
) {
  const item = await getOwnedSupplierOrThrow(id, auth);
  await assertCanModifyBusinessPlan(item.businessPlan, auth);
  return prisma.businessPlanSupplier.update({ where: { id }, data: input });
}

export async function deleteSupplier(id: string, auth: AuthenticatedUser) {
  const item = await getOwnedSupplierOrThrow(id, auth);
  await assertCanModifyBusinessPlan(item.businessPlan, auth);
  await prisma.businessPlanSupplier.delete({ where: { id } });
}
