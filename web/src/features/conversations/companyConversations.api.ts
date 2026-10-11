import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { Conversation, ConversationListItem, Message } from "@/types";

function convKey(companyId: string | undefined) {
  return ["company-conversations", companyId];
}
export function msgKey(
  companyId: string | undefined,
  conversationId: string | undefined,
) {
  return ["company-conversation-messages", companyId, conversationId];
}

export function useStartCompanyConversation(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      target: { candidateId: string } | { targetCompanyId: string },
    ): Promise<Conversation> =>
      (await apiClient.post(`/companies/${companyId}/conversations`, target))
        .data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: convKey(companyId) }),
  });
}

export function useCompanyConversations(companyId: string | undefined) {
  return useQuery({
    queryKey: convKey(companyId),
    queryFn: async (): Promise<ConversationListItem[]> =>
      (await apiClient.get(`/companies/${companyId}/conversations`)).data,
    enabled: !!companyId,
    // Standard (15s) sur la liste — le polling resserré ne s'applique qu'au
    // fil activement ouvert (voir useCompanyMessages), cohérent avec la
    // décision stratégique de ne pas solliciter le serveur inutilement
    // ailleurs qu'où l'utilisateur regarde activement.
    refetchInterval: 15_000,
  });
}

export function useCompanyMessages(
  companyId: string | undefined,
  conversationId: string | undefined,
  pollingEnabled = true,
) {
  return useQuery({
    queryKey: msgKey(companyId, conversationId),
    queryFn: async (): Promise<Message[]> =>
      (
        await apiClient.get(
          `/companies/${companyId}/conversations/${conversationId}/messages`,
        )
      ).data,
    enabled: !!companyId && !!conversationId,
    // Coupé quand useConversationSocket confirme une connexion active (POC
    // messagerie, voir évaluation stratégique) — reste le filet de sécurité
    // par défaut sinon.
    refetchInterval: pollingEnabled ? 3_000 : false,
  });
}

export function useSendCompanyMessage(
  companyId: string,
  conversationId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string): Promise<Message> =>
      (
        await apiClient.post(
          `/companies/${companyId}/conversations/${conversationId}/messages`,
          { body },
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: msgKey(companyId, conversationId),
      });
      queryClient.invalidateQueries({ queryKey: convKey(companyId) });
    },
  });
}

export function useMarkCompanyConversationRead(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) =>
      (
        await apiClient.patch(
          `/companies/${companyId}/conversations/${conversationId}/read`,
        )
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: convKey(companyId) }),
  });
}

export function useReportCompanyConversation(
  companyId: string,
  conversationId: string,
) {
  return useMutation({
    mutationFn: async (reason: string) =>
      (
        await apiClient.post(
          `/companies/${companyId}/conversations/${conversationId}/report`,
          { reason },
        )
      ).data,
  });
}
