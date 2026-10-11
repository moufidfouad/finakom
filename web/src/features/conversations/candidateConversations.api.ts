import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateApiClient } from "@/lib/candidateAxios";
import { Conversation, ConversationListItem, Message } from "@/types";

const CONV_KEY = ["candidate-conversations"];
export function msgKey(conversationId: string | undefined) {
  return ["candidate-conversation-messages", conversationId];
}

export function useStartCandidateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (companyId: string): Promise<Conversation> =>
      (await candidateApiClient.post("/candidate/conversations", { companyId }))
        .data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONV_KEY }),
  });
}

export function useCandidateConversations() {
  return useQuery({
    queryKey: CONV_KEY,
    queryFn: async (): Promise<ConversationListItem[]> =>
      (await candidateApiClient.get("/candidate/conversations")).data,
    refetchInterval: 15_000,
  });
}

export function useCandidateMessages(
  conversationId: string | undefined,
  pollingEnabled = true,
) {
  return useQuery({
    queryKey: msgKey(conversationId),
    queryFn: async (): Promise<Message[]> =>
      (
        await candidateApiClient.get(
          `/candidate/conversations/${conversationId}/messages`,
        )
      ).data,
    enabled: !!conversationId,
    // Coupé quand useConversationSocket confirme une connexion active (POC
    // messagerie, voir évaluation stratégique) — reste le filet de sécurité
    // par défaut sinon, jamais les deux mécanismes actifs en même temps.
    refetchInterval: pollingEnabled ? 3_000 : false,
  });
}

export function useSendCandidateMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string): Promise<Message> =>
      (
        await candidateApiClient.post(
          `/candidate/conversations/${conversationId}/messages`,
          { body },
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: msgKey(conversationId) });
      queryClient.invalidateQueries({ queryKey: CONV_KEY });
    },
  });
}

export function useMarkCandidateConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) =>
      (
        await candidateApiClient.patch(
          `/candidate/conversations/${conversationId}/read`,
        )
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONV_KEY }),
  });
}

export function useReportCandidateConversation(conversationId: string) {
  return useMutation({
    mutationFn: async (reason: string) =>
      (
        await candidateApiClient.post(
          `/candidate/conversations/${conversationId}/report`,
          { reason },
        )
      ).data,
  });
}
