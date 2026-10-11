import { NextFunction, Request, Response } from "express";
import { AppError } from "@/utils/AppError";
import { verifyAccessToken } from "@/config/jwt";
import { COOKIE_NAMES } from "@/config/cookies";
import { AuthenticatedUser } from "@/types/express";
import { env } from "@/config/env";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAMES.ACCESS];

  if (!token) {
    return next(AppError.unauthorized("Non authentifié"));
  }

  try {
    const payload = verifyAccessToken<AuthenticatedUser>(
      token,
      env.JWT_ACCESS_SECRET,
    );
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    next(AppError.unauthorized("Session invalide ou expirée"));
  }
}
