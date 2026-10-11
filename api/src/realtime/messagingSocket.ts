import type { Server, Socket } from "socket.io";
import { prisma } from "@/config/prisma";

function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

/**
 * Vérifie une participation RÉELLE avant de laisser une socket rejoindre la
 * room d'une conversation — jamais déduit de l'identité seule, toujours
 * confirmé contre la table de jonction, exactement le même principe que
 * assertParticipant côté REST (conversations.service.ts). Un utilisateur
 * entreprise peut appartenir à plusieurs sociétés : on vérifie que L'UNE
 * D'ELLES est bien participante, pas une société précise.
 */
async function isRealParticipant(
  conversationId: string,
  actor: NonNullable<Socket["actor"]>,
): Promise<boolean> {
  if (actor.kind === "CANDIDATE") {
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, candidateId: actor.candidateId },
    });
    return !!participant;
  }

  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId,
      company: { members: { some: { userId: actor.userId } } },
    },
  });
  return !!participant;
}

/**
 * POC scopé à la messagerie uniquement (voir évaluation stratégique) —
 * n'émet que l'événement 'new_message' pour un fil de conversation ouvert.
 * Les notifications et la liste des conversations restent en polling : ce
 * n'est pas un remplacement de cette infrastructure, une preuve de concept
 * pour juger le compromis avant de généraliser.
 */
export function registerMessagingSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    socket.on(
      "join_conversation",
      async (conversationId: unknown, ack?: (ok: boolean) => void) => {
        if (typeof conversationId !== "string" || !socket.actor)
          return ack?.(false);

        const allowed = await isRealParticipant(conversationId, socket.actor);
        if (!allowed) return ack?.(false);

        socket.join(conversationRoom(conversationId));
        ack?.(true);
      },
    );

    socket.on("leave_conversation", (conversationId: unknown) => {
      if (typeof conversationId === "string")
        socket.leave(conversationRoom(conversationId));
    });
  });
}

/** Appelée depuis conversations.service.ts après l'écriture en base — jamais
 * avant : le message existe déjà réellement quand l'événement part, pas de
 * risque d'notifier un message qui échouerait ensuite à s'enregistrer. */
export function emitNewMessage(
  io: Server,
  conversationId: string,
  message: unknown,
) {
  io.to(conversationRoom(conversationId)).emit("new_message", message);
}
