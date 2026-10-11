import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  registerSchema,
  requestVerificationResendSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.schemas";
import * as authService from "./auth.service";
import {
  CANDIDATE_COOKIE_NAMES,
  COOKIE_NAMES,
  issueSessionCookies,
} from "@/config/cookies";

function clearSessionCookies(res: Response) {
  res.clearCookie(COOKIE_NAMES.ACCESS, { path: "/" });
  res.clearCookie(COOKIE_NAMES.REFRESH, { path: "/" });
  res.clearCookie(COOKIE_NAMES.CSRF, { path: "/" });
}

export const registerHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    issueSessionCookies(res, result, COOKIE_NAMES, CANDIDATE_COOKIE_NAMES);
    res.status(201).json({ user: result.user });
  },
);

export const loginHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    issueSessionCookies(res, result, COOKIE_NAMES, CANDIDATE_COOKIE_NAMES);
    res.status(200).json({ user: result.user });
  },
);

export const googleAuthHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = googleAuthSchema.parse(req.body);
    const result = await authService.loginOrRegisterWithGoogle(input.idToken);
    issueSessionCookies(res, result, COOKIE_NAMES, CANDIDATE_COOKIE_NAMES);
    res.status(200).json({ user: result.user });
  },
);

export const refreshHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH];
    if (!refreshToken)
      throw AppError.unauthorized("Session expirée, merci de vous reconnecter");

    const result = await authService.refresh(refreshToken);
    issueSessionCookies(res, result, COOKIE_NAMES, CANDIDATE_COOKIE_NAMES);
    res.status(200).json({ user: result.user });
  },
);

export const logoutHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    clearSessionCookies(res);
    res.status(200).json({ success: true });
  },
);

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const profile = await authService.getProfile(req.user.userId);
  res.status(200).json(profile);
});

export const changePasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const input = changePasswordSchema.parse(req.body);
    await authService.changePassword(req.user.userId, input);
    res.status(200).json({ success: true });
  },
);

export const forgotPasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = forgotPasswordSchema.parse(req.body);
    await authService.requestPasswordReset(input);
    // Réponse toujours identique, que l'email existe ou non — évite l'énumération de comptes.
    res.status(200).json({
      success: true,
      message:
        "Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.",
    });
  },
);

export const resetPasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(input);
    res.status(200).json({ success: true });
  },
);

export const verifyEmailHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = verifyEmailSchema.parse(req.body);
    await authService.verifyEmail(input);
    res.status(200).json({ success: true });
  },
);

export const resendVerificationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    await authService.resendVerificationEmail(req.user.userId);
    res.status(200).json({ success: true });
  },
);

/**
 * Version publique (non authentifiée) — indispensable maintenant que login()
 * refuse les comptes non vérifiés : sans session, l'endpoint ci-dessus est
 * inaccessible. Réponse toujours identique, que l'email existe/soit déjà
 * vérifié ou non — évite l'énumération de comptes.
 */
export const requestVerificationResendHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = requestVerificationResendSchema.parse(req.body);
    await authService.requestVerificationEmailResend(input.email);
    res.status(200).json({
      success: true,
      message:
        "Si un compte existe avec cet email et n'est pas encore vérifié, un nouveau lien vient de lui être envoyé.",
    });
  },
);
