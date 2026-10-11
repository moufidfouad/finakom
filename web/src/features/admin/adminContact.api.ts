import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
export interface ContactMessagesPage {
  items: ContactMessage[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useContactMessages(page: number, unreadOnly: boolean) {
  return useQuery({
    queryKey: ["admin-contact-messages", page, unreadOnly],
    queryFn: async (): Promise<ContactMessagesPage> =>
      (
        await apiClient.get("/contact", {
          params: { page, pageSize: 20, unreadOnly: unreadOnly || undefined },
        })
      ).data,
  });
}
export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    // Déclenché silencieusement à l'ouverture d'un message : pas de toast, ce n'est
    // pas une action explicite de l'utilisateur.
    mutationFn: async ({ id, isRead }: { id: string; isRead: boolean }) =>
      (await apiClient.patch(`/contact/${id}/read`, { isRead })).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] }),
  });
}
export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/contact/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      toast.success("Message supprimé.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer le message."),
      ),
  });
}
