import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import {
  createVerificationToken,
  consumeVerificationToken,
} from "@/utils/verificationToken";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/modules/email/email.service";
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "./auth.schemas";
import { verifyGoogleIdToken } from "./google.service";
import { decideGoogleAccountAction } from "./googleAccountLinking";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../config/jwt";
import { comparePassword, hashPassword } from "@/utils/bcrypt";
import { AuthenticatedUser } from "@/types/express";
import { env } from "@/config/env";

type UserForAuth = {
  id: string;
  email: string;
  fullName: string | null;
  role: "USER" | "ADMIN" | "SUPERADMIN";
  emailVerified: boolean;
};

function buildAuthResponse(user: UserForAuth) {
  const payload = { userId: user.id, email: user.email, role: user.role };
  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    accessToken: signAccessToken<AuthenticatedUser>(payload, {
      secret: env.JWT_ACCESS_SECRET,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    }),
    refreshToken: signRefreshToken<AuthenticatedUser>(payload, {
      secret: env.JWT_REFRESH_SECRET,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    }),
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw AppError.conflict("Un compte existe déjà avec cet email");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      authProvider: "local",
      emailVerified: false,
    },
  });

  // L'échec d'envoi de l'email de vérification ne doit jamais empêcher
  // l'inscription elle-même (voir sendMail() : erreurs capturées, jamais propagées).
  const rawToken = await createVerificationToken(user.id, "EMAIL_VERIFICATION");
  await sendVerificationEmail(user.email, user.fullName, rawToken);

  return buildAuthResponse(user);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw AppError.unauthorized("Email ou mot de passe incorrect");
  }
  if (!user.passwordHash) {
    throw AppError.unauthorized(
      "Ce compte utilise la connexion Google — merci de vous connecter avec Google.",
    );
  }

  const isValid = await hashPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw AppError.unauthorized("Email ou mot de passe incorrect");
  }

  // Vérifié APRÈS le mot de passe (jamais avant) : un attaquant qui ne connaît
  // pas le mot de passe ne doit jamais apprendre si un compte existe et n'est
  // "que" non vérifié — seul quelqu'un qui a déjà prouvé connaître le bon mot
  // de passe reçoit ce message actionnable plutôt qu'un refus générique.
  // Concerne surtout les membres créés par un administrateur d'entreprise
  // (members.service.ts) : ils doivent prouver la maîtrise de leur boîte mail
  // avant d'accéder au compte que l'admin a créé en leur nom.
  if (!user.emailVerified) {
    throw new AppError(
      "Merci de vérifier votre adresse email avant de vous connecter. Un lien vous a été envoyé par email.",
      401,
      { code: "EMAIL_NOT_VERIFIED" },
    );
  }

  return buildAuthResponse(user);
}

/**
 * Connexion ou inscription via Google. Le jeton d'identité est vérifié
 * directement auprès de Google (google.service.ts). La décision "connecter /
 * rattacher un compte local existant / créer un nouveau compte" est déléguée à
 * une fonction pure testée en isolation (googleAccountLinking.ts).
 */
export async function loginOrRegisterWithGoogle(idToken: string) {
  const profile = await verifyGoogleIdToken(idToken);

  const [userByGoogleId, userByEmail] = await Promise.all([
    prisma.user.findUnique({ where: { googleId: profile.googleId } }),
    prisma.user.findUnique({ where: { email: profile.email } }),
  ]);

  const action = decideGoogleAccountAction({ userByGoogleId, userByEmail });

  let user: UserForAuth;
  if (action.kind === "LOGIN_EXISTING_GOOGLE") {
    user = await prisma.user.findUniqueOrThrow({
      where: { id: action.userId },
    });
  } else if (action.kind === "LINK_EXISTING_LOCAL") {
    // Google a déjà vérifié cet email avant d'émettre le jeton : le rattachement
    // est légitime, et on peut marquer l'email comme vérifié au passage.
    user = await prisma.user.update({
      where: { id: action.userId },
      data: { googleId: profile.googleId, emailVerified: true },
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        fullName: profile.fullName,
        googleId: profile.googleId,
        authProvider: "google",
        emailVerified: true,
        passwordHash: null,
      },
    });
  }

  return buildAuthResponse(user);
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken<AuthenticatedUser>(
      refreshToken,
      env.JWT_REFRESH_SECRET,
    );
  } catch {
    throw AppError.unauthorized("Refresh token invalide ou expiré");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw AppError.unauthorized("Utilisateur introuvable");
  }

  return buildAuthResponse(user);
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      emailVerified: true,
      authProvider: true,
      createdAt: true,
    },
  });
  if (!user) throw AppError.notFound("Utilisateur introuvable");
  return user;
}

/** Change le mot de passe d'un utilisateur connecté. Si le compte n'a pas encore
 * de mot de passe local (créé via Google), on le définit directement — sinon
 * l'ancien mot de passe doit être fourni et correct. */
export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.passwordHash) {
    if (!input.currentPassword) {
      throw AppError.badRequest("Le mot de passe actuel est requis.");
    }
    const isValid = await comparePassword(
      input.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw AppError.unauthorized("Mot de passe actuel incorrect.");
    }
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

/** Ne révèle jamais si l'email existe ou non (le contrôleur répond toujours un
 * succès générique) — évite l'énumération de comptes. */
export async function requestPasswordReset(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) return;

  const rawToken = await createVerificationToken(user.id, "PASSWORD_RESET");
  await sendPasswordResetEmail(user.email, user.fullName, rawToken);
}

export async function resetPassword(input: ResetPasswordInput) {
  const userId = await consumeVerificationToken(input.token, "PASSWORD_RESET");
  const passwordHash = await hashPassword(input.newPassword);
  // Cliquer sur un lien reçu par email prouve la maîtrise de la boîte mail :
  // on en profite pour marquer l'email comme vérifié s'il ne l'était pas encore.
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, emailVerified: true },
  });
}

export async function verifyEmail(input: VerifyEmailInput) {
  const userId = await consumeVerificationToken(
    input.token,
    "EMAIL_VERIFICATION",
  );
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });
}

export async function resendVerificationEmail(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.emailVerified) {
    throw AppError.badRequest("Cet email est déjà vérifié.");
  }
  const rawToken = await createVerificationToken(user.id, "EMAIL_VERIFICATION");
  await sendVerificationEmail(user.email, user.fullName, rawToken);
}

/**
 * Version PUBLIQUE (non authentifiée) du renvoi d'email de vérification —
 * indispensable maintenant que login() refuse les comptes non vérifiés : un
 * utilisateur qui n'a pas encore de session ne peut pas appeler l'endpoint
 * authentifié ci-dessus. Même principe anti-énumération que requestPasswordReset :
 * ne révèle jamais si l'email existe, ni s'il est déjà vérifié.
 */
export async function requestVerificationEmailResend(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) return;

  const rawToken = await createVerificationToken(user.id, "EMAIL_VERIFICATION");
  await sendVerificationEmail(user.email, user.fullName, rawToken);
}
