import type { Server, Socket } from "socket.io";
import { prisma } from "@/config/prisma";

function candidateRoom(candidateId: string): string {
  return `candidate:${candidateId}`;
}

function companyRoom(companyId: string): string {
  return `company:${companyId}`;
}

/**
 * Contrairement aux conversations (room rejointe à la demande, avec
 * vérification explicite de participation), les rooms de notification sont
 * auto-rejointes à la connexion : l'identité vérifiée par socketAuthMiddleware
 * EST la preuve d'appartenance — un candidat appartient à sa propre room par
 * définition, un utilisateur entreprise à celle de chaque société dont il
 * est membre (interrogé une fois à la connexion, pas à chaque notification).
 */
export function registerNotificationsSocketHandlers(io: Server) {
  io.on("connection", async (socket: Socket) => {
    if (!socket.actor) return;

    if (socket.actor.kind === "CANDIDATE") {
      socket.join(candidateRoom(socket.actor.candidateId));
      return;
    }

    const memberships = await prisma.companyMember.findMany({
      where: { userId: socket.actor.userId },
      select: { companyId: true },
    });
    for (const { companyId } of memberships) {
      socket.join(companyRoom(companyId));
    }
  });
}

/**
 * Signal léger, pas la notification elle-même — le client réinterroge la
 * liste fusionnée (offres, messages de contact, conversations non lues) via
 * l'API REST habituelle. Reconstruire cette fusion à trois sources côté
 * émission dupliquerait une logique déjà correcte ailleurs, avec le risque
 * qu'elle diverge un jour ; la base de données reste la seule source de
 * vérité, le socket ne fait que dire "quelque chose a changé, revérifie".
 */
export function emitCandidateNotificationsChanged(
  io: Server,
  candidateId: string,
) {
  io.to(candidateRoom(candidateId)).emit("notifications_changed", {
    candidateId,
  });
}

export function emitCompanyNotificationsChanged(io: Server, companyId: string) {
  io.to(companyRoom(companyId)).emit("notifications_changed", { companyId });
}
