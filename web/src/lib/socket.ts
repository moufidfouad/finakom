import { io, Socket } from "socket.io-client";
import { getServerOrigin } from "./axios";

/**
 * POC scopé à la messagerie (voir évaluation stratégique) — une seule
 * connexion partagée pour toute l'app plutôt qu'une par composant monté.
 * Créée à la demande (pas à l'import) : une page qui n'ouvre jamais de fil de
 * conversation ne doit jamais établir de connexion socket. withCredentials
 * transmet les cookies httpOnly existants (session entreprise ou candidate)
 * à la poignée de main — aucun jeton géré manuellement côté client, cohérent
 * avec le reste de l'authentification de ce projet.
 */
let socket: Socket | undefined;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getServerOrigin(), {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}
