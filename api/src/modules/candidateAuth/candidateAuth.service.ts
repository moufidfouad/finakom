import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import {
  createCandidateVerificationToken,
  consumeCandidateVerificationToken,
} from "@/utils/candidateVerificationToken";
import {
  sendCandidatePasswordResetEmail,
  sendCandidateVerificationEmail,
} from "@/modules/email/email.service";
import { verifyGoogleIdToken } from "@/modules/auth/google.service";
import { decideGoogleAccountAction } from "@/modules/auth/googleAccountLinking";
import {
  CandidateChangePasswordInput,
  CandidateForgotPasswordInput,
  CandidateLoginInput,
  CandidateRegisterInput,
  CandidateResetPasswordInput,
  CandidateVerifyEmailInput,
} from "./candidateAuth.schemas";
import { AuthenticatedCandidate } from "@/types/express";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/config/jwt";
import { env } from "@/config/env";
import { comparePassword, hashPassword } from "@/utils/bcrypt";

type CandidateForAuth = {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
};

function buildAuthResponse(candidate: CandidateForAuth) {
  const payload = { candidateId: candidate.id, email: candidate.email };
  return {
    candidate: {
      id: candidate.id,
      email: candidate.email,
      fullName: candidate.fullName,
      emailVerified: candidate.emailVerified,
    },
    accessToken: signAccessToken<AuthenticatedCandidate>(payload, {
      secret: env.CANDIDATE_JWT_ACCESS_SECRET,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    }),
    refreshToken: signRefreshToken<AuthenticatedCandidate>(payload, {
      secret: env.CANDIDATE_JWT_REFRESH_SECRET,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    }),
  };
}

export async function registerCandidate(input: CandidateRegisterInput) {
  const existing = await prisma.candidate.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw AppError.conflict("Un compte candidat existe déjà avec cet email");
  }

  const passwordHash = await hashPassword(input.password);

  const candidate = await prisma.candidate.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      emailVerified: false,
    },
  });

  // Même principe qu'en espace entreprise : l'échec d'envoi de l'email ne
  // doit jamais empêcher l'inscription elle-même (sendMail capture ses erreurs).
  const rawToken = await createCandidateVerificationToken(
    candidate.id,
    "EMAIL_VERIFICATION",
  );
  await sendCandidateVerificationEmail(
    candidate.email,
    candidate.fullName,
    rawToken,
  );

  return buildAuthResponse(candidate);
}

/**
 * Réutilise verifyGoogleIdToken et decideGoogleAccountAction (génériques,
 * partagées avec l'espace entreprise) — seule la partie couplée au modèle
 * Candidate est dupliquée, par nécessité (Prisma ne permet pas de
 * généraliser un accès entre deux tables différentes).
 */
export async function loginOrRegisterWithGoogleCandidate(idToken: string) {
  const profile = await verifyGoogleIdToken(idToken);

  const [candidateByGoogleId, candidateByEmail] = await Promise.all([
    prisma.candidate.findUnique({ where: { googleId: profile.googleId } }),
    prisma.candidate.findUnique({ where: { email: profile.email } }),
  ]);

  const action = decideGoogleAccountAction({
    userByGoogleId: candidateByGoogleId,
    userByEmail: candidateByEmail,
  });

  let candidate: CandidateForAuth;
  if (action.kind === "LOGIN_EXISTING_GOOGLE") {
    candidate = await prisma.candidate.findUniqueOrThrow({
      where: { id: action.userId },
    });
  } else if (action.kind === "LINK_EXISTING_LOCAL") {
    // Google a déjà vérifié cet email avant d'émettre le jeton : le rattachement
    // est légitime, et on peut marquer l'email comme vérifié au passage.
    candidate = await prisma.candidate.update({
      where: { id: action.userId },
      data: { googleId: profile.googleId, emailVerified: true },
    });
  } else {
    candidate = await prisma.candidate.create({
      data: {
        email: profile.email,
        // Candidate.fullName reste non nullable (contrairement à User) pour
        // ne pas casser tout le code déjà écrit qui suppose une chaîne —
        // repli explicite plutôt qu'un changement de type à large impact.
        fullName: profile.fullName ?? profile.email.split("@")[0],
        googleId: profile.googleId,
        authProvider: "google",
        emailVerified: true,
        passwordHash: null,
      },
    });
  }

  return buildAuthResponse(candidate);
}

export async function loginCandidate(input: CandidateLoginInput) {
  const candidate = await prisma.candidate.findUnique({
    where: { email: input.email },
  });
  if (!candidate) {
    throw AppError.unauthorized("Email ou mot de passe incorrect");
  }
  if (!candidate.passwordHash) {
    throw AppError.unauthorized(
      "Ce compte utilise la connexion Google — merci de vous connecter avec Google.",
    );
  }

  const isValid = await comparePassword(input.password, candidate.passwordHash);
  if (!isValid) {
    throw AppError.unauthorized("Email ou mot de passe incorrect");
  }

  // Même ordre de vérification qu'en espace entreprise (mot de passe validé
  // AVANT de révéler que l'email n'est pas vérifié) — jamais l'inverse, pour
  // ne jamais laisser un attaquant sans le bon mot de passe distinguer un
  // compte existant-mais-non-vérifié d'un compte inexistant.
  if (!candidate.emailVerified) {
    throw new AppError(
      "Merci de vérifier votre adresse email avant de vous connecter. Un lien vous a été envoyé par email.",
      401,
      { code: "EMAIL_NOT_VERIFIED" },
    );
  }

  return buildAuthResponse(candidate);
}

export async function refreshCandidate(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken<AuthenticatedCandidate>(
      refreshToken,
      env.CANDIDATE_JWT_REFRESH_SECRET,
    );
  } catch {
    throw AppError.unauthorized("Refresh token invalide ou expiré");
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: payload.candidateId },
  });
  if (!candidate) {
    throw AppError.unauthorized("Candidat introuvable");
  }

  return buildAuthResponse(candidate);
}

export async function getCandidateProfile(candidateId: string) {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      emailVerified: true,
      createdAt: true,
    },
  });
  if (!candidate) throw AppError.notFound("Candidat introuvable");
  return candidate;
}

/** Si le compte n'a pas encore de mot de passe local (créé via Google), on le
 * définit directement — sinon l'ancien mot de passe doit être fourni et correct. */
export async function changeCandidatePassword(
  candidateId: string,
  input: CandidateChangePasswordInput,
) {
  const candidate = await prisma.candidate.findUniqueOrThrow({
    where: { id: candidateId },
  });

  if (candidate.passwordHash) {
    if (!input.currentPassword) {
      throw AppError.badRequest("Le mot de passe actuel est requis.");
    }
    const isValid = await comparePassword(
      input.currentPassword,
      candidate.passwordHash,
    );
    if (!isValid) {
      throw AppError.unauthorized("Mot de passe actuel incorrect.");
    }
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { passwordHash },
  });
}

/** Ne révèle jamais si l'email existe ou non — évite l'énumération de comptes. */
export async function requestCandidatePasswordReset(
  input: CandidateForgotPasswordInput,
) {
  const candidate = await prisma.candidate.findUnique({
    where: { email: input.email },
  });
  if (!candidate) return;

  const rawToken = await createCandidateVerificationToken(
    candidate.id,
    "PASSWORD_RESET",
  );
  await sendCandidatePasswordResetEmail(
    candidate.email,
    candidate.fullName,
    rawToken,
  );
}

export async function resetCandidatePassword(
  input: CandidateResetPasswordInput,
) {
  const candidateId = await consumeCandidateVerificationToken(
    input.token,
    "PASSWORD_RESET",
  );
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { passwordHash, emailVerified: true },
  });
}

export async function verifyCandidateEmail(input: CandidateVerifyEmailInput) {
  const candidateId = await consumeCandidateVerificationToken(
    input.token,
    "EMAIL_VERIFICATION",
  );
  await prisma.candidate.update({
    where: { id: candidateId },
    data: { emailVerified: true },
  });
}

export async function resendCandidateVerificationEmail(candidateId: string) {
  const candidate = await prisma.candidate.findUniqueOrThrow({
    where: { id: candidateId },
  });
  if (candidate.emailVerified) {
    throw AppError.badRequest("Cet email est déjà vérifié.");
  }
  const rawToken = await createCandidateVerificationToken(
    candidate.id,
    "EMAIL_VERIFICATION",
  );
  await sendCandidateVerificationEmail(
    candidate.email,
    candidate.fullName,
    rawToken,
  );
}

/** Version publique (non authentifiée) du renvoi d'email de vérification —
 * même principe anti-énumération que requestCandidatePasswordReset. */
export async function requestCandidateVerificationEmailResend(email: string) {
  const candidate = await prisma.candidate.findUnique({ where: { email } });
  if (!candidate || candidate.emailVerified) return;

  const rawToken = await createCandidateVerificationToken(
    candidate.id,
    "EMAIL_VERIFICATION",
  );
  await sendCandidateVerificationEmail(
    candidate.email,
    candidate.fullName,
    rawToken,
  );
}
