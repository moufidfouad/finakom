const CSRF_COOKIE_NAME = import.meta.env.VITE_COOKIE_CSRF_NAME;

/**
 * Lit le cookie CSRF (volontairement non httpOnly, donc lisible ici) pour le
 * renvoyer en en-tête X-CSRF-Token sur les requêtes mutantes — schéma
 * "double-submit cookie" attendu par le backend (voir middlewares/csrf.ts).
 */
export function getCsrfToken(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}
