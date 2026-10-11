import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { STANDARD_CHART_OF_ACCOUNTS } from "./chartOfAccounts.seedData";
import {
  CreateAccountInput,
  UpdateAccountInput,
} from "./chartOfAccounts.schemas";

export async function listAccounts(companyId: string, auth: AuthenticatedUser) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return prisma.chartOfAccount.findMany({
    where: { companyId },
    orderBy: { accountNumber: "asc" },
  });
}

/**
 * Pré-remplit le plan comptable d'une entreprise avec la trame SYSCOHADA
 * standard — n'écrase jamais un compte déjà existant au même numéro (idempotent,
 * peut être rappelé sans risque si l'entreprise a déjà commencé à compléter son plan).
 */
export async function seedDefaultAccounts(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  const existing = await prisma.chartOfAccount.findMany({
    where: { companyId },
    select: { accountNumber: true },
  });
  const existingNumbers = new Set(
    existing.map((a: { accountNumber: string }) => a.accountNumber),
  );

  const toCreate = STANDARD_CHART_OF_ACCOUNTS.filter(
    (a) => !existingNumbers.has(a.accountNumber),
  );
  if (toCreate.length === 0) return listAccounts(companyId, auth);

  await prisma.chartOfAccount.createMany({
    data: toCreate.map((a) => ({
      companyId,
      accountNumber: a.accountNumber,
      label: a.label,
      classe: a.accountNumber.charAt(0),
      role: a.role as never,
    })),
  });
  return listAccounts(companyId, auth);
}

export async function createAccount(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateAccountInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);

  const existing = await prisma.chartOfAccount.findFirst({
    where: { companyId, accountNumber: input.accountNumber },
  });
  if (existing)
    throw AppError.conflict(
      `Le compte ${input.accountNumber} existe déjà dans le plan comptable.`,
    );

  if (input.role) await clearExistingRole(companyId, input.role);

  return prisma.chartOfAccount.create({
    data: {
      companyId,
      accountNumber: input.accountNumber,
      label: input.label,
      classe: input.accountNumber.charAt(0),
      role: input.role as never,
    },
  });
}

export async function updateAccount(
  accountId: string,
  auth: AuthenticatedUser,
  input: UpdateAccountInput,
) {
  const account = await prisma.chartOfAccount.findUniqueOrThrow({
    where: { id: accountId },
  });
  await getOwnedCompanyOrThrow(account.companyId, auth);

  if (input.role)
    await clearExistingRole(account.companyId, input.role, accountId);

  return prisma.chartOfAccount.update({
    where: { id: accountId },
    data: input as never,
  });
}

export async function deleteAccount(
  accountId: string,
  auth: AuthenticatedUser,
) {
  const account = await prisma.chartOfAccount.findUniqueOrThrow({
    where: { id: accountId },
  });
  await getOwnedCompanyOrThrow(account.companyId, auth);

  const usageCount = await prisma.journalEntryLine.count({
    where: { chartOfAccountId: accountId },
  });
  if (usageCount > 0) {
    throw AppError.conflict(
      `Ce compte est utilisé par ${usageCount} ligne(s) d'écriture et ne peut pas être supprimé — désactivez-le plutôt.`,
    );
  }
  await prisma.chartOfAccount.delete({ where: { id: accountId } });
}

/**
 * Un rôle (ex: "CLIENTS") ne peut être porté que par UN SEUL compte à la fois
 * pour une entreprise donnée — la contre-passation automatique a besoin d'une
 * cible déterministe. Assigner un rôle à un compte le retire donc silencieusement
 * de tout autre compte qui le portait (plutôt que de rejeter l'opération, ce qui
 * obligerait l'utilisateur à faire deux manipulations pour un simple transfert de rôle).
 */
async function clearExistingRole(
  companyId: string,
  role: string,
  exceptAccountId?: string,
) {
  await prisma.chartOfAccount.updateMany({
    where: {
      companyId,
      role: role as never,
      ...(exceptAccountId ? { id: { not: exceptAccountId } } : {}),
    },
    data: { role: null },
  });
}

/** Résout le compte réel de l'entreprise portant un rôle donné — utilisé par la
 * contre-passation automatique (factures, paiements...). Lève une erreur claire
 * et actionnable si le rôle n'est pas encore configuré, plutôt qu'un échec silencieux. */
export async function resolveAccountForRole(companyId: string, role: string) {
  const account = await prisma.chartOfAccount.findFirst({
    where: { companyId, role: role as never, isActive: true },
  });
  if (!account) {
    throw AppError.badRequest(
      `Aucun compte du plan comptable n'est configuré avec le rôle "${role}" — associez un compte à ce rôle dans les paramètres de comptabilité avant de continuer.`,
    );
  }
  return account;
}
