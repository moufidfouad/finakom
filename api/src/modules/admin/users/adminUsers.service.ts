import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { createVerificationToken } from "@/utils/verificationToken";
import { sendVerificationEmail } from "@/modules/email/email.service";
import { UpdateUserInput } from "./adminUsers.schemas";

const USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  emailVerified: true,
  authProvider: true,
  createdAt: true,
  _count: { select: { companies: true, companyMemberships: true } },
};

export async function listUsers() {
  return prisma.user.findMany({
    select: USER_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
  if (!user) throw AppError.notFound("Utilisateur introuvable");
  return user;
}

/** Réservé au SUPERADMIN — voir requireSuperAdmin sur la route. */
export async function updateUser(
  userId: string,
  requesterId: string,
  input: UpdateUserInput,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound("Utilisateur introuvable");

  // Un superadmin ne peut pas se rétrograder lui-même par erreur en perdant tout
  // accès à cette même fonctionnalité (garde-fou simple, pas une vraie contrainte
  // métier — juste évite un verrouillage accidentel).
  if (userId === requesterId && input.role && input.role !== "SUPERADMIN") {
    throw AppError.badRequest(
      "Vous ne pouvez pas retirer votre propre rôle SUPERADMIN.",
    );
  }

  const emailChanged = !!input.email && input.email !== user.email;
  if (emailChanged) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing)
      throw AppError.conflict("Un autre compte utilise déjà cet email.");
  }

  // Changer l'email invalide sa vérification précédente : personne n'a encore
  // prouvé la maîtrise de cette NOUVELLE boîte mail. On renvoie un email de
  // vérification, sauf pour un compte Google (son email reste toujours
  // vérifié par Google — le modifier ici le désynchroniserait de toute façon).
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...input,
      ...(emailChanged && user.authProvider === "local"
        ? { emailVerified: false }
        : {}),
    },
    select: USER_SELECT,
  });

  if (emailChanged && user.authProvider === "local" && updated.email) {
    const rawToken = await createVerificationToken(
      userId,
      "EMAIL_VERIFICATION",
    );
    await sendVerificationEmail(updated.email, updated.fullName, rawToken);
  }

  return updated;
}
