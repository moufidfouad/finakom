import { NextFunction, Request, Response } from "express";
import { AppError } from "@/utils/AppError";

/** ADMIN et SUPERADMIN ont tous deux accès aux fonctions d'administration (ex: messagerie de contact). */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(AppError.unauthorized());
  if (req.user.role !== "ADMIN" && req.user.role !== "SUPERADMIN") {
    return next(AppError.forbidden("Accès réservé aux administrateurs"));
  }
  next();
}

/** Réservé exclusivement au SUPERADMIN (ex: actions de plateforme les plus sensibles). */
export function requireSuperAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user) return next(AppError.unauthorized());
  if (req.user.role !== "SUPERADMIN") {
    return next(AppError.forbidden("Accès réservé au super-administrateur"));
  }
  next();
}
