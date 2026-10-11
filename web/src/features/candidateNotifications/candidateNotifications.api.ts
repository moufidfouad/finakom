import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateApiClient } from "@/lib/candidateAxios";
import { CandidateJobNotification } from "@/types";

export const NOTIFICATIONS_KEY = ["candidate-notifications"];

export function useCandidateNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async (): Promise<CandidateJobNotification[]> =>
      (await candidateApiClient.get("/candidate/notifications")).data,
    // "Instantané" pour l'in-app reste, en l'absence de WebSocket/SSE dans ce
    // projet, un polling rapproché plutôt qu'un vrai push serveur→client —
    // 15s donne une perception proche du temps réel sans solliciter le
    // serveur à outrance. L'email, lui, est envoyé réellement à l'instant de
    // la publication (voir createNotificationsForJobPosting côté backend).
    refetchInterval: 15_000,
  });
}

/** Route vers le bon endpoint selon le type — les deux sources de
 * notification (offre correspondante, message reçu) sont deux tables
 * distinctes côté backend, jamais confondues même si l'UI les fusionne. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      type,
    }: {
      id: string;
      type: CandidateJobNotification["type"];
    }) => {
      const path =
        type === "job_match"
          ? `/candidate/notifications/${id}/read`
          : `/candidate/notifications/contact/${id}/read`;
      return (await candidateApiClient.patch(path)).data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}
