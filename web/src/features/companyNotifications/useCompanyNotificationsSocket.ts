import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { notificationsKey } from "./companyNotifications.api";

/**
 * Pendant entreprise de useCandidateNotificationsSocket — même principe
 * (signal léger, pas de payload complet). Différence : un utilisateur peut
 * appartenir à plusieurs entreprises, donc le socket a rejoint la room de
 * CHACUNE d'elles à la connexion — ce hook filtre explicitement sur
 * companyId pour n'invalider que celle actuellement affichée, jamais toutes
 * les entreprises de l'utilisateur à chaque signal reçu.
 */
export function useCompanyNotificationsSocket(companyId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    function handleChanged(payload: { companyId?: string }) {
      if (payload.companyId !== companyId) return;
      queryClient.invalidateQueries({ queryKey: notificationsKey(companyId) });
    }

    socket.on("notifications_changed", handleChanged);
    if (!socket.connected) socket.connect();

    return () => {
      socket.off("notifications_changed", handleChanged);
    };
  }, [companyId, queryClient]);
}
