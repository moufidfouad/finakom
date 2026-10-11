export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
}

/** Espace candidat — volontairement distinct d'AuthenticatedUser (pas de
 * role plateforme, pas de rattachement à une entreprise). */
export interface AuthenticatedCandidate {
  candidateId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      candidate?: AuthenticatedCandidate;
    }
  }
}

export {};
