import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { Payment, PaymentInput } from "@/types";

export function usePayments(documentId: string | undefined) {
  return useQuery({
    queryKey: ["payments", documentId],
    queryFn: async (): Promise<Payment[]> =>
      (await apiClient.get(`/documents/${documentId}/payments`)).data,
    enabled: !!documentId,
  });
}

export function useCreatePayment(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PaymentInput): Promise<Payment> =>
      (await apiClient.post(`/documents/${documentId}/payments`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", documentId] });
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Paiement enregistré.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer le paiement."),
      ),
  });
}

export function useDeletePayment(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: string) => {
      await apiClient.delete(`/documents/${documentId}/payments/${paymentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", documentId] });
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Paiement supprimé.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer le paiement."),
      ),
  });
}
