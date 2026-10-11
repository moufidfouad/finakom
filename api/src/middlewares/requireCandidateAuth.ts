import { NextFunction, Request, Response } from "express";
import { AppError } from "@/utils/AppError";
import { CANDIDATE_COOKIE_NAMES } from "@/config/cookies";
import { verifyAccessToken } from "@/config/jwt";
import { AuthenticatedCandidate } from "@/types/express";
import { env } from "@/config/env";

export function requireCandidateAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.[CANDIDATE_COOKIE_NAMES.ACCESS];

  if (!token) {
    return next(AppError.unauthorized("Non authentifié"));
  }

  try {
    const payload = verifyAccessToken<AuthenticatedCandidate>(
      token,
      env.CANDIDATE_JWT_ACCESS_SECRET,
    );
    req.candidate = { candidateId: payload.candidateId, email: payload.email };
    next();
  } catch {
    next(AppError.unauthorized("Session invalide ou expirée"));
  }
}
