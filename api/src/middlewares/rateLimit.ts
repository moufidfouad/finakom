import { NextFunction, Request, Response } from "express";
import { AppError } from "@/utils/AppError";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= maxRequests) {
      return next(
        AppError.badRequest(
          "Trop de requêtes. Merci de réessayer dans quelques minutes.",
        ),
      );
    }

    bucket.count += 1;
    next();
  };
}
