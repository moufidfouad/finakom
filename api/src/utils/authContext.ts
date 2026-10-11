import { Request } from "express";
import { AppError } from "./AppError";
import { AuthenticatedUser } from "@/types/express";

/** Extrait { userId, role } de la requête authentifiée, ou lève 401. */
export function requireAuthContext(req: Request): AuthenticatedUser {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export function isSuperAdmin(role: string): boolean {
  return role === "SUPERADMIN";
}

/**
 * Clause Prisma "where" pour une ressource directement rattachée à un userId
 * (ex: Company.userId). Un SUPERADMIN voit tout : la clause est vide (aucun filtre).
 */
export function ownerWhere(auth: AuthenticatedUser): { userId?: string } {
  return isSuperAdmin(auth.role) ? {} : { userId: auth.userId };
}

/**
 * Clause Prisma "where" pour une ressource rattachée à une Company elle-même
 * rattachée à un userId (ex: Employee.company.userId, Client.company.userId...).
 */
export function ownerWhereNested(auth: AuthenticatedUser): {
  company?: { userId: string };
} {
  return isSuperAdmin(auth.role) ? {} : { company: { userId: auth.userId } };
}

/**
 * Accès "administrateur d'entreprise" : le créateur (Company.userId), OU un
 * CompanyMember avec le rôle ADMIN, OU le SUPERADMIN. Utilisé pour tout ce qui
 * gère l'entreprise elle-même : paramètres, personnel, finance, membres, et la
 * mutation des documents commerciaux d'un tiers.
 */
export function companyAdminWhere(auth: AuthenticatedUser) {
  if (isSuperAdmin(auth.role)) return {};
  return {
    OR: [
      { userId: auth.userId },
      { members: { some: { userId: auth.userId, role: "ADMIN" as const } } },
    ],
  };
}

export function companyAdminWhereNested(auth: AuthenticatedUser) {
  if (isSuperAdmin(auth.role)) return {};
  return {
    company: {
      OR: [
        { userId: auth.userId },
        { members: { some: { userId: auth.userId, role: "ADMIN" as const } } },
      ],
    },
  };
}

/**
 * Accès "membre d'entreprise" (ADMIN ou MEMBER) : le créateur, OU tout
 * CompanyMember (quel que soit son rôle), OU le SUPERADMIN. Utilisé pour le
 * périmètre commercial qu'un simple membre doit pouvoir consulter/manipuler :
 * clients, catalogue produits, devis/factures/bons de livraison.
 */
export function companyMemberWhere(auth: AuthenticatedUser) {
  if (isSuperAdmin(auth.role)) return {};
  return {
    OR: [
      { userId: auth.userId },
      { members: { some: { userId: auth.userId } } },
    ],
  };
}

export function companyMemberWhereNested(auth: AuthenticatedUser) {
  if (isSuperAdmin(auth.role)) return {};
  return {
    company: {
      OR: [
        { userId: auth.userId },
        { members: { some: { userId: auth.userId } } },
      ],
    },
  };
}
