const CANDIDATE_CSRF_COOKIE_NAME = import.meta.env.VITE_CANDIDATE_COOKIE_CSRF_NAME;

/** Réplique lib/csrf.ts, mais sur le cookie CSRF candidat — jamais le même
 * nom que l'espace entreprise (voir backend/config/cookies.ts). */
export function getCandidateCsrfToken(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CANDIDATE_CSRF_COOKIE_NAME}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : null;
}
