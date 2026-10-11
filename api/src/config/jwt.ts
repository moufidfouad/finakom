import jwt from "jsonwebtoken";
import { AuthenticatedUser } from "@/types/express";

export type JwtPayload = AuthenticatedUser;

export function signAccessToken<T extends object>(
  payload: T,
  { secret, expiresIn }: { secret: string; expiresIn: string | number },
): string {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken<T extends object>(
  payload: T,
  { secret, expiresIn }: { secret: string; expiresIn: string | number },
): string {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken<T>(token: string, secret: string): T {
  return jwt.verify(token, secret) as T;
}

export function verifyRefreshToken<T>(token: string, secret: string): T {
  return jwt.verify(token, secret) as T;
}
