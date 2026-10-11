import { CookieOptions, Response } from "express";
import { env } from "./env";
import { generateRawToken } from "@/utils/tokenCrypto";

export interface CookieNameSet {
  readonly ACCESS: string;
  readonly REFRESH: string;
  readonly CSRF: string;
}

export const COOKIE_NAMES = {
  ACCESS: env.COOKIE_ACCESS_NAME,
  REFRESH: env.COOKIE_REFRESH_NAME,
  CSRF: env.COOKIE_CSRF_NAME,
} as const;

export const CANDIDATE_COOKIE_NAMES = {
  ACCESS: env.CANDIDATE_COOKIE_ACCESS_NAME,
  REFRESH: env.CANDIDATE_COOKIE_REFRESH_NAME,
  CSRF: env.CANDIDATE_COOKIE_CSRF_NAME,
} as const;

/** Convertit une durée façon JWT ("15m", "7d", "3600s") en millisecondes. */
function parseDurationToMs(duration: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(duration.trim());
  if (!match) return 15 * 60 * 1000; // repli raisonnable : 15 minutes

  const value = Number(match[1]);
  const unit = match[2] ?? "s";
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * (multipliers[unit] ?? 1000);
}

export const ACCESS_TOKEN_MAX_AGE_MS = parseDurationToMs(
  env.JWT_ACCESS_EXPIRES_IN,
);
export const REFRESH_TOKEN_MAX_AGE_MS = parseDurationToMs(
  env.JWT_REFRESH_EXPIRES_IN,
);

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export function accessTokenCookieOptions(): CookieOptions {
  return { ...baseCookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE_MS };
}

export function refreshTokenCookieOptions(
  maxAge = REFRESH_TOKEN_MAX_AGE_MS,
): CookieOptions {
  return { ...baseCookieOptions, maxAge };
}

/** Le cookie CSRF doit être lisible par le JS front (double-submit cookie pattern) : pas httpOnly. */
export function csrfCookieOptions(
  maxAge = REFRESH_TOKEN_MAX_AGE_MS,
): CookieOptions {
  return {
    httpOnly: false,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export function setCsrfCookie(
  res: Response,
  names: {
    readonly CSRF: string;
  },
  maxAge?: number,
): string {
  const token = generateRawToken();
  res.cookie(names.CSRF, token, csrfCookieOptions(maxAge));
  return token;
}

export function clearSessionCookies(
  res: Response,
  names: {
    readonly ACCESS: string;
    readonly REFRESH: string;
    readonly CSRF: string;
  },
) {
  res.clearCookie(names.ACCESS, { path: "/" });
  res.clearCookie(names.REFRESH, { path: "/" });
  res.clearCookie(names.CSRF, { path: "/" });
}

export function issueSessionCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  own: CookieNameSet,
  other: CookieNameSet,
  maxAge?: number,
) {
  res.cookie(own.ACCESS, tokens.accessToken, accessTokenCookieOptions());
  res.cookie(own.REFRESH, tokens.refreshToken, refreshTokenCookieOptions());
  setCsrfCookie(res, own, maxAge);
  res.clearCookie(other.ACCESS, { path: "/" });
  res.clearCookie(other.REFRESH, { path: "/" });
  res.clearCookie(other.CSRF, { path: "/" });
}
