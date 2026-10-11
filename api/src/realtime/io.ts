import type { Server } from "socket.io";

/**
 * Singleton partagé entre server.ts (qui crée l'instance) et les services
 * métier comme conversations.service.ts (qui émettent des événements) — évite
 * une dépendance circulaire (server.ts importe déjà les routes, qui importent
 * les services ; les services ne peuvent pas importer server.ts en retour).
 * getIO() lève explicitement plutôt que de renvoyer undefined en silence : un
 * appel avant l'initialisation est un bug de démarrage à corriger, pas un cas
 * à absorber silencieusement (aucun message ne serait jamais perdu pour de
 * bon, la base de données reste la source de vérité — mais mieux vaut le
 * savoir immédiatement).
 */
let io: Server | undefined;

export function setIO(instance: Server): void {
  io = instance;
}

export function getIO(): Server {
  if (!io)
    throw new Error(
      "Socket.io n'est pas encore initialisé — setIO() doit être appelé au démarrage du serveur.",
    );
  return io;
}

export function isIOReady(): boolean {
  return !!io;
}
