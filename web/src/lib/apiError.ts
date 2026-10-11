import { AxiosError } from "axios";

export function getApiErrorMessage(
  err: unknown,
  fallback = "Une erreur est survenue.",
): string {
  if (err instanceof AxiosError) {
    const body = err.response?.data as { error?: string } | undefined;
    if (body?.error) return body.error;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/** Extrait un code d'erreur machine-readable (ex: "EMAIL_NOT_VERIFIED") quand le
 * backend en fournit un via `AppError.details.code` — plus fiable que de
 * comparer le message d'erreur (texte destiné à l'affichage, pas à la logique). */
export function getApiErrorCode(err: unknown): string | undefined {
  if (err instanceof AxiosError) {
    const body = err.response?.data as
      | { details?: { code?: string } }
      | undefined;
    return body?.details?.code;
  }
  return undefined;
}
