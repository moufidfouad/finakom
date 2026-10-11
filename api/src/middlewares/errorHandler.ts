import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "@/utils/AppError";
import { env } from "@/config/env";

export function notFoundHandler(req: Request, res: Response) {
  res
    .status(404)
    .json({ error: `Route introuvable : ${req.method} ${req.originalUrl}` });
}
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: "Erreur de validation",
      details: err.flatten().fieldErrors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  console.error("💥 Erreur non gérée :", err);
  return res.status(500).json({
    error: "Erreur interne du serveur",
    ...(env.NODE_ENV === "development" && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
}
