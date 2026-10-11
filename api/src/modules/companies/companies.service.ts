import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import {
  companyAdminWhere,
  companyMemberWhere,
  isSuperAdmin,
} from "@/utils/authContext";
import { CreateCompanyInput, UpdateCompanyInput } from "./companies.schemas";
import { UpdateDirectorySettingsInput } from "@/modules/publicCompanies/publicCompanies.schemas";

/**
 * Accès "administrateur" à une entreprise, sinon 404 (créateur, membre ADMIN, ou
 * SUPERADMIN). Utilisé pour tout ce qui gère l'entreprise : paramètres, personnel,
 * finance, membres, mutation d'un document créé par un tiers.
 */
export async function getOwnedCompanyOrThrow(
  companyId: string,
  auth: AuthenticatedUser,
) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, ...companyAdminWhere(auth) },
  });
  if (!company) throw AppError.notFound("Entreprise introuvable");
  return company;
}

/**
 * Accès "membre" à une entreprise, sinon 404 (créateur, tout CompanyMember, ou
 * SUPERADMIN). Utilisé pour le périmètre commercial qu'un simple membre doit
 * pouvoir consulter/manipuler : clients, catalogue, devis/factures/BL.
 */
export async function getMemberCompanyOrThrow(
  companyId: string,
  auth: AuthenticatedUser,
) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, ...companyMemberWhere(auth) },
  });
  if (!company) throw AppError.notFound("Entreprise introuvable");
  return company;
}

export async function listCompanies(auth: AuthenticatedUser) {
  return prisma.company.findMany({
    where: companyMemberWhere(auth),
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { analyses: true } },
      ...(isSuperAdmin(auth.role)
        ? { user: { select: { email: true, fullName: true } } }
        : {}),
    },
  });
}

/** Crée l'entreprise et rattache immédiatement son créateur comme membre ADMIN. */
export async function createCompany(userId: string, input: CreateCompanyInput) {
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({ data: { ...input, userId } });
    await tx.companyMember.create({
      data: { companyId: company.id, userId, role: "ADMIN" },
    });
    return company;
  });
}

export async function getCompany(companyId: string, auth: AuthenticatedUser) {
  return getMemberCompanyOrThrow(companyId, auth);
}

/** Vérifie si l'utilisateur est administrateur de l'entreprise donnée (créateur, membre ADMIN, ou SUPERADMIN). */
export async function isCompanyAdmin(
  companyId: string,
  auth: AuthenticatedUser,
): Promise<boolean> {
  if (isSuperAdmin(auth.role)) return true;
  const company = await prisma.company.findFirst({
    where: { id: companyId, ...companyAdminWhere(auth) },
    select: { id: true },
  });
  return !!company;
}

export async function updateCompany(
  companyId: string,
  auth: AuthenticatedUser,
  input: UpdateCompanyInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return prisma.company.update({ where: { id: companyId }, data: input });
}

/** Publication/dépublication au répertoire public d'entreprises — même
 * protection que updateCompany (propriétaire/admin), c'est une décision qui
 * engage l'image publique de l'entreprise entière, pas un simple réglage
 * technique ouvert à tout membre. */
export async function updateDirectorySettings(
  companyId: string,
  auth: AuthenticatedUser,
  input: UpdateDirectorySettingsInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  return prisma.company.update({ where: { id: companyId }, data: input });
}

export async function deleteCompany(
  companyId: string,
  auth: AuthenticatedUser,
) {
  await getOwnedCompanyOrThrow(companyId, auth);
  await prisma.company.delete({ where: { id: companyId } });
}
