import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { AuthenticatedUser } from "@/types/express";
import { getOwnedCompanyOrThrow } from "@/modules/companies/companies.service";
import { createVerificationToken } from "@/utils/verificationToken";
import { sendVerificationEmail } from "@/modules/email/email.service";
import { CreateMemberInput } from "./members.schemas";
import { hashPassword } from "@/utils/bcrypt";

const MEMBER_SELECT = {
  role: true,
  createdAt: true,
  user: { select: { id: true, email: true, fullName: true, createdAt: true } },
};

/**
 * Liste les membres d'une entreprise (accès administrateur uniquement). Auto-
 * cicatrisant : si le créateur historique de l'entreprise n'a pas encore de ligne
 * CompanyMember (entreprises créées avant l'introduction de ce modèle), on la
 * crée à la volée pour qu'il apparaisse bien comme administrateur.
 */
export async function listMembers(companyId: string, auth: AuthenticatedUser) {
  const company = await getOwnedCompanyOrThrow(companyId, auth);

  await prisma.companyMember.upsert({
    where: { companyId_userId: { companyId, userId: company.userId } },
    update: {},
    create: { companyId, userId: company.userId, role: "ADMIN" },
  });

  return prisma.companyMember.findMany({
    where: { companyId },
    select: MEMBER_SELECT,
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Rattache un utilisateur à l'entreprise en tant que membre. Si l'email n'existe
 * pas encore, crée le compte utilisateur (mot de passe requis dans ce cas). Si
 * l'email existe déjà, l'utilisateur existant est simplement rattaché (son mot
 * de passe n'est jamais modifié par cette voie).
 */
export async function createMember(
  companyId: string,
  auth: AuthenticatedUser,
  input: CreateMemberInput,
) {
  await getOwnedCompanyOrThrow(companyId, auth);

  let user = await prisma.user.findUnique({ where: { email: input.email } });
  let isNewUser = false;

  if (!user) {
    if (!input.password) {
      throw AppError.badRequest(
        "Un mot de passe est requis pour créer un nouvel utilisateur (cet email n'existe pas encore).",
      );
    }
    const passwordHash = await hashPassword(input.password);
    user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        authProvider: "local",
        emailVerified: false,
      },
    });
    isNewUser = true;
  }

  const existingMembership = await prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId: user.id } },
  });
  if (existingMembership) {
    throw AppError.conflict(
      "Cet utilisateur est déjà membre de cette entreprise.",
    );
  }

  const membership = await prisma.companyMember.create({
    data: { companyId, userId: user.id, role: input.role },
    select: MEMBER_SELECT,
  });

  if (isNewUser) {
    const rawToken = await createVerificationToken(
      user.id,
      "EMAIL_VERIFICATION",
    );
    await sendVerificationEmail(user.email, user.fullName, rawToken);
  }

  return membership;
}

export async function updateMemberRole(
  companyId: string,
  memberUserId: string,
  auth: AuthenticatedUser,
  role: "ADMIN" | "MEMBER",
) {
  const company = await getOwnedCompanyOrThrow(companyId, auth);
  if (memberUserId === company.userId) {
    throw AppError.badRequest(
      "Le rôle du créateur de l'entreprise ne peut pas être modifié : il est administrateur de fait.",
    );
  }

  const membership = await prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId: memberUserId } },
  });
  if (!membership)
    throw AppError.notFound(
      "Ce membre ne fait pas partie de cette entreprise.",
    );

  return prisma.companyMember.update({
    where: { companyId_userId: { companyId, userId: memberUserId } },
    data: { role },
    select: MEMBER_SELECT,
  });
}

export async function removeMember(
  companyId: string,
  memberUserId: string,
  auth: AuthenticatedUser,
) {
  const company = await getOwnedCompanyOrThrow(companyId, auth);
  if (memberUserId === company.userId) {
    throw AppError.badRequest(
      "Le créateur de l'entreprise ne peut pas être retiré de ses propres membres.",
    );
  }

  const membership = await prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId: memberUserId } },
  });
  if (!membership)
    throw AppError.notFound(
      "Ce membre ne fait pas partie de cette entreprise.",
    );

  await prisma.companyMember.delete({
    where: { companyId_userId: { companyId, userId: memberUserId } },
  });
}
