import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import {
  candidateChangePasswordSchema,
  candidateForgotPasswordSchema,
  candidateGoogleAuthSchema,
  candidateLoginSchema,
  candidateRegisterSchema,
  candidateRequestVerificationResendSchema,
  candidateResetPasswordSchema,
  candidateVerifyEmailSchema,
} from "./candidateAuth.schemas";
import * as candidateAuthService from "./candidateAuth.service";
import {
  CANDIDATE_COOKIE_NAMES,
  clearSessionCookies,
  COOKIE_NAMES,
  issueSessionCookies,
  setCsrfCookie,
} from "@/config/cookies";

export const candidateRegisterHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = candidateRegisterSchema.parse(req.body);
    const result = await candidateAuthService.registerCandidate(input);
    issueSessionCookies(res, result, CANDIDATE_COOKIE_NAMES, COOKIE_NAMES);
    res.status(201).json({ candidate: result.candidate });
  },
);

export const candidateLoginHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = candidateLoginSchema.parse(req.body);
    const result = await candidateAuthService.loginCandidate(input);
    issueSessionCookies(res, result, CANDIDATE_COOKIE_NAMES, COOKIE_NAMES);
    res.status(200).json({ candidate: result.candidate });
  },
);

export const candidateGoogleAuthHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = candidateGoogleAuthSchema.parse(req.body);
    const result =
      await candidateAuthService.loginOrRegisterWithGoogleCandidate(
        input.idToken,
      );
    issueSessionCookies(res, result, CANDIDATE_COOKIE_NAMES, COOKIE_NAMES);
    res.status(200).json({ candidate: result.candidate });
  },
);

export const candidateRefreshHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.[CANDIDATE_COOKIE_NAMES.REFRESH];
    if (!refreshToken)
      throw AppError.unauthorized("Session expirée, merci de vous reconnecter");

    const result = await candidateAuthService.refreshCandidate(refreshToken);
    issueSessionCookies(res, result, CANDIDATE_COOKIE_NAMES, COOKIE_NAMES);
    res.status(200).json({ candidate: result.candidate });
  },
);

export const candidateLogoutHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    clearSessionCookies(res, CANDIDATE_COOKIE_NAMES);
    res.status(200).json({ success: true });
  },
);

export const candidateMeHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    const profile = await candidateAuthService.getCandidateProfile(
      req.candidate.candidateId,
    );
    setCsrfCookie(res, CANDIDATE_COOKIE_NAMES);
    res.status(200).json(profile);
  },
);

export const candidateChangePasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    const input = candidateChangePasswordSchema.parse(req.body);
    await candidateAuthService.changeCandidatePassword(
      req.candidate.candidateId,
      input,
    );
    res.status(200).json({ success: true });
  },
);

export const candidateForgotPasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = candidateForgotPasswordSchema.parse(req.body);
    await candidateAuthService.requestCandidatePasswordReset(input);
    res.status(200).json({
      success: true,
      message:
        "Si un compte existe avec cet email, un lien de réinitialisation vient de lui être envoyé.",
    });
  },
);

export const candidateResetPasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = candidateResetPasswordSchema.parse(req.body);
    await candidateAuthService.resetCandidatePassword(input);
    res.status(200).json({ success: true });
  },
);

export const candidateVerifyEmailHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = candidateVerifyEmailSchema.parse(req.body);
    await candidateAuthService.verifyCandidateEmail(input);
    res.status(200).json({ success: true });
  },
);

export const candidateResendVerificationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    await candidateAuthService.resendCandidateVerificationEmail(
      req.candidate.candidateId,
    );
    res.status(200).json({ success: true });
  },
);

export const candidateRequestVerificationResendHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = candidateRequestVerificationResendSchema.parse(req.body);
    await candidateAuthService.requestCandidateVerificationEmailResend(
      input.email,
    );
    res.status(200).json({
      success: true,
      message:
        "Si un compte existe avec cet email et n'est pas encore vérifié, un nouveau lien vient de lui être envoyé.",
    });
  },
);
