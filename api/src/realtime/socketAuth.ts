import type { Socket } from "socket.io";
import { COOKIE_NAMES, CANDIDATE_COOKIE_NAMES } from "@/config/cookies";
import { verifyAccessToken } from "@/config/jwt";
import { AuthenticatedCandidate, AuthenticatedUser } from "@/types/express";
import { env } from "@/config/env";

/** Parseur minimal — évite d'ajouter une dépendance (et ses @types) pour une
 * opération aussi simple que "key1=val1; key2=val2". Ne gère pas les
 * attributs (Max-Age, Path...) : le header `cookie` envoyé par le navigateur
 * ne contient jamais que des paires nom=valeur, ces attributs restent côté
 * serveur émetteur. */
function parseCookieHeader(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of header.split(";")) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) continue;
    const key = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}

export type SocketActor =
  | { kind: "USER"; userId: string }
  | { kind: "CANDIDATE"; candidateId: string };

declare module "socket.io" {
  interface Socket {
    actor?: SocketActor;
  }
}

/**
 * Réutilise exactement les mêmes secrets et cookies que l'authentification
 * REST (verifyAccessToken / verifyCandidateAccessToken) — jamais un système
 * d'identité parallèle pour le canal temps réel. Une connexion peut porter
 * soit un cookie entreprise, soit un cookie candidat (jamais les deux à la
 * fois pour une même socket), cohérent avec l'exclusivité de session déjà en
 * place côté REST. Rejette la connexion si aucun des deux n'est valide —
 * jamais de socket anonyme autorisée à rejoindre une conversation.
 */
export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
) {
  const rawCookieHeader = socket.handshake.headers.cookie;
  if (!rawCookieHeader) return next(new Error("Authentification requise."));

  const cookies = parseCookieHeader(rawCookieHeader);

  const companyToken = cookies[COOKIE_NAMES.ACCESS];
  if (companyToken) {
    try {
      const payload = verifyAccessToken<AuthenticatedUser>(
        companyToken,
        env.JWT_ACCESS_SECRET,
      );
      socket.actor = { kind: "USER", userId: payload.userId };
      return next();
    } catch {
      // Jeton entreprise présent mais invalide/expiré — on retente côté
      // candidat avant d'abandonner, au cas où les deux cookies coexistent
      // dans le même navigateur avec seulement celui-ci périmé.
    }
  }

  const candidateToken = cookies[CANDIDATE_COOKIE_NAMES.ACCESS];
  if (candidateToken) {
    try {
      const payload = verifyAccessToken<AuthenticatedCandidate>(
        candidateToken,
        env.CANDIDATE_JWT_ACCESS_SECRET,
      );
      socket.actor = { kind: "CANDIDATE", candidateId: payload.candidateId };
      return next();
    } catch {
      // idem
    }
  }

  return next(new Error("Authentification requise."));
}
