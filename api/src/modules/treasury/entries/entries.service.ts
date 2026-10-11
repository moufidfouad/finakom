import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { companyMemberWhereNested } from "@/utils/authContext";
import { getMemberCompanyOrThrow } from "@/modules/companies/companies.service";
import { assertCanModifyOwnedResource } from "@/utils/resourceOwnership";
import {
  CreateTreasuryEntryInput,
  UpdateTreasuryEntryInput,
} from "./entries.schemas";
import { recordAuditLog } from "@/modules/auditLog/auditLog.service";

/**
 * Règle d'autorisation spécifique au module trésorerie : un MEMBER peut gérer
 * (modifier/supprimer) les écritures qu'il a lui-même créées ; un administrateur
 * de l'entreprise a accès à toutes les écritures ; le SUPERADMIN a tous les droits.
 */
async function assertCanModifyEntry(
  entry: { companyId: string; createdById: string | null },
  auth: AuthenticatedUser,
) {
  await assertCanModifyOwnedResource(entry, auth, {
    errorMessage:
      "Seul le créateur de cette écriture, un administrateur de l'entreprise, ou le super-administrateur peut la modifier.",
  });
}

export async function getOwnedTreasuryEntryOrThrow(
  entryId: string,
  auth: AuthenticatedUser,
) {
  const entry = await prisma.treasuryEntry.findFirst({
    where: { id: entryId, ...companyMemberWhereNested(auth) },
    include: {
      createdBy: { select: { id: true, email: true, fullName: true } },
    },
  });
  if (!entry) throw AppError.notFound("Écriture introuvable");
  return entry;
}

export async function listEntries(
  companyId: string,
  auth: AuthenticatedUser,
  filters: { from?: Date; to?: Date } = {},
) {
  await getMemberCompanyOrThrow(companyId, auth);
  return prisma.treasuryEntry.findMany({
    where: {
      companyId,
      ...(filters.from || filters.to
        ? {
            date: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "asc" },
    include: {
      createdBy: { select: { id: true, email: true, fullName: true } },
    },
  });
}

export async function createEntry(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateTreasuryEntryInput,
) {
  await getMemberCompanyOrThrow(companyId, auth);
  const entry = await prisma.treasuryEntry.create({
    data: { ...input, companyId, createdById: auth.userId },
    include: {
      createdBy: { select: { id: true, email: true, fullName: true } },
    },
  });
  await recordAuditLog({
    companyId,
    userId: auth.userId,
    action: "CREATE",
    entityType: "TreasuryEntry",
    entityId: entry.id,
    entityLabel: `${entry.type} — ${entry.category}`,
    summary: `Créée : ${Number(entry.amount).toLocaleString("fr-FR")} (${entry.support})`,
  });
  return entry;
}

export async function updateEntry(
  entryId: string,
  auth: AuthenticatedUser,
  input: UpdateTreasuryEntryInput,
) {
  const entry = await getOwnedTreasuryEntryOrThrow(entryId, auth);
  await assertCanModifyEntry(entry, auth);
  const updated = await prisma.treasuryEntry.update({
    where: { id: entryId },
    data: input,
    include: {
      createdBy: { select: { id: true, email: true, fullName: true } },
    },
  });
  await recordAuditLog({
    companyId: entry.companyId,
    userId: auth.userId,
    action: "UPDATE",
    entityType: "TreasuryEntry",
    entityId: entryId,
    entityLabel: `${updated.type} — ${updated.category}`,
    summary: `Modifiée : ${Number(updated.amount).toLocaleString("fr-FR")} (${updated.support})`,
  });
  return updated;
}

export async function deleteEntry(entryId: string, auth: AuthenticatedUser) {
  const entry = await getOwnedTreasuryEntryOrThrow(entryId, auth);
  await assertCanModifyEntry(entry, auth);
  await prisma.treasuryEntry.delete({ where: { id: entryId } });
  await recordAuditLog({
    companyId: entry.companyId,
    userId: auth.userId,
    action: "DELETE",
    entityType: "TreasuryEntry",
    entityId: entryId,
    entityLabel: `${entry.type} — ${entry.category}`,
    summary: `Supprimée : ${Number(entry.amount).toLocaleString("fr-FR")} (${entry.support})`,
  });
}
