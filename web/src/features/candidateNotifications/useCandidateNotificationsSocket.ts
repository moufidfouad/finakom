import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { NOTIFICATIONS_KEY } from "./candidateNotifications.api";

/**
 * Généralisation du POC messagerie (voir évaluation stratégique) aux
 * notifications candidates — signal léger uniquement : le serveur ne pousse
 * jamais la notification elle-même (trois sources fusionnées côté REST,
 * dupliquer cette fusion à l'émission serait fragile), juste "quelque chose
 * a changé", et ce hook redemande la liste via le mécanisme React Query
 * existant. Pas de room à rejoindre explicitement ici, contrairement à une
 * conversation : le serveur rejoint automatiquement la room personnelle du
 * candidat à la connexion, dès que l'identité est vérifiée.
 */
export function useCandidateNotificationsSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    function handleChanged() {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    }

    socket.on("notifications_changed", handleChanged);
    if (!socket.connected) socket.connect();

    return () => {
      socket.off("notifications_changed", handleChanged);
    };
  }, [queryClient]);
}
