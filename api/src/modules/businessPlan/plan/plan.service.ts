import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { companyMemberWhereNested } from "@/utils/authContext";
import { getMemberCompanyOrThrow } from "@/modules/companies/companies.service";
import { assertCanModifyOwnedResource } from "@/utils/resourceOwnership";
import {
  CreateBusinessPlanInput,
  UpdateBusinessPlanInput,
} from "./plan.schemas";

const PLAN_INCLUDE = {
  createdBy: { select: { id: true, email: true, fullName: true } },
};

/** Accès en lecture : tout membre de l'entreprise (créateur, ADMIN, MEMBER, ou SUPERADMIN). */
export async function getOwnedBusinessPlanOrThrow(
  planId: string,
  auth: AuthenticatedUser,
) {
  const plan = await prisma.businessPlan.findFirst({
    where: { id: planId, ...companyMemberWhereNested(auth) },
    include: PLAN_INCLUDE,
  });
  if (!plan) throw AppError.notFound("Business plan introuvable");
  return plan;
}

/**
 * Règle métier précisée explicitement : un business plan peut être créé par
 * n'importe quel membre de l'entreprise, mais seul son créateur, l'administrateur
 * de l'entreprise, ou le SUPERADMIN peut ensuite le modifier ou le supprimer —
 * même règle que les documents commerciaux et les écritures de trésorerie.
 */
export async function assertCanModifyBusinessPlan(
  plan: { companyId: string; createdById: string | null },
  auth: AuthenticatedUser,
): Promise<void> {
  await assertCanModifyOwnedResource(plan, auth, {
    errorMessage:
      "Seul le créateur de ce business plan, un administrateur de l'entreprise, ou le super-administrateur peut le modifier.",
  });
}

export async function listBusinessPlans(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getMemberCompanyOrThrow(companyId, auth);
  return prisma.businessPlan.findMany({
    where: { companyId },
    orderBy: { updatedAt: "desc" },
    include: PLAN_INCLUDE,
  });
}

export async function createBusinessPlan(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateBusinessPlanInput,
) {
  await getMemberCompanyOrThrow(companyId, auth);
  return prisma.businessPlan.create({
    data: { ...input, companyId, createdById: auth.userId },
    include: PLAN_INCLUDE,
  });
}

export async function getBusinessPlan(planId: string, auth: AuthenticatedUser) {
  return getOwnedBusinessPlanOrThrow(planId, auth);
}

export async function updateBusinessPlan(
  planId: string,
  auth: AuthenticatedUser,
  input: UpdateBusinessPlanInput,
) {
  const plan = await getOwnedBusinessPlanOrThrow(planId, auth);
  await assertCanModifyBusinessPlan(plan, auth);

  const data: Record<string, unknown> = { ...input };
  if (input.narrativeSections) {
    // Fusionne avec les sections existantes plutôt que d'écraser tout le JSON —
    // permet d'enregistrer une seule section à la fois depuis le frontend.
    const existing =
      (plan.narrativeSections as Record<string, unknown> | null) ?? {};
    data.narrativeSections = { ...existing, ...input.narrativeSections };
  }

  return prisma.businessPlan.update({
    where: { id: planId },
    data,
    include: PLAN_INCLUDE,
  });
}

export async function deleteBusinessPlan(
  planId: string,
  auth: AuthenticatedUser,
) {
  const plan = await getOwnedBusinessPlanOrThrow(planId, auth);
  await assertCanModifyBusinessPlan(plan, auth);
  await prisma.businessPlan.delete({ where: { id: planId } });
}
