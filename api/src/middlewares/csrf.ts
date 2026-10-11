import { NextFunction, Request, Response } from "express";
import { AppError } from "@/utils/AppError";
import { CANDIDATE_COOKIE_NAMES, COOKIE_NAMES } from "@/config/cookies";
import { env } from "@/config/env";

const CSRF_HEADER = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Routes mutantes qui ne nécessitent pas de jeton CSRF car elles ne s'appuient sur
 * aucune session cookie préexistante : soit elles créent la session (login/register/
 * refresh), soit elles sont publiques par nature (soumission du formulaire de contact).
 */
const CSRF_EXEMPT: { method: string; path?: string; pattern?: RegExp }[] = [
  { method: "POST", path: `/${env.API_V1_URL}/auth/register` },
  { method: "POST", path: `/${env.API_V1_URL}/auth/login` },
  { method: "POST", path: `/${env.API_V1_URL}/auth/google` },
  { method: "POST", path: `/${env.API_V1_URL}/auth/refresh` },
  { method: "POST", path: `/${env.API_V1_URL}auth/verify-email` },
  { method: "POST", path: `/${env.API_V1_URL}/auth/request-verification` },
  { method: "POST", path: `/${env.API_V1_URL}/auth/forgot-password` },
  { method: "POST", path: `/${env.API_V1_URL}/auth/reset-password` },
  { method: "POST", path: `/${env.API_V1_URL}/contact` },
  { method: "POST", path: `/${env.API_V1_URL}/candidate-auth/register` },
  { method: "POST", path: `/${env.API_V1_URL}/candidate-auth/login` },
  { method: "POST", path: `/${env.API_V1_URL}/candidate-auth/refresh` },
  { method: "POST", path: `/${env.API_V1_URL}/candidate-auth/verify-email` },
  {
    method: "POST",
    path: `/${env.API_V1_URL}/candidate-auth/request-verification`,
  },
  { method: "POST", path: `/${env.API_V1_URL}/candidate-auth/forgot-password` },
  { method: "POST", path: `/${env.API_V1_URL}/candidate-auth/reset-password` },
  {
    method: "POST",
    pattern: new RegExp(`^/${env.API_V1_URL}/candidates/[^/]+/contact$`),
  },
];

/**
 * Protection CSRF en double-submit cookie, appliquée globalement à toute requête
 * mutante (POST/PUT/PATCH/DELETE) sur /api, sauf routes publiques exemptées ci-dessus.
 * Le cookie CSRF (lisible par le JS, non httpOnly) doit correspondre à l'en-tête
 * X-CSRF-Token envoyé par le front : un site tiers peut faire rejouer les cookies
 * httpOnly par le navigateur de la victime, mais ne peut ni lire le cookie CSRF
 * (politique de même origine) ni donc reproduire l'en-tête attendu.
 */
export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (
    CSRF_EXEMPT.some(
      (r) =>
        r.method === req.method &&
        (req.path === r.path || r.pattern?.test(req.path)),
    )
  ) {
    return next();
  }

  const cookieToken =
    req.cookies?.[COOKIE_NAMES.CSRF] ??
    req.cookies?.[CANDIDATE_COOKIE_NAMES.CSRF];

  const headerToken = req.header(CSRF_HEADER);


  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(AppError.forbidden("Jeton CSRF manquant ou invalide"));
  }
  next();
}
