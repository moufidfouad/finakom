import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { SupplierPayment, SupplierPaymentInput } from "@/types";

export function useSupplierPayments(documentId: string | undefined) {
  return useQuery({
    queryKey: ["supplier-payments", documentId],
    queryFn: async (): Promise<SupplierPayment[]> =>
      (await apiClient.get(`/purchase-documents/${documentId}/payments`)).data,
    enabled: !!documentId,
  });
}

export function useCreateSupplierPayment(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SupplierPaymentInput): Promise<SupplierPayment> =>
      (
        await apiClient.post(
          `/purchase-documents/${documentId}/payments`,
          input,
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supplier-payments", documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["purchase-document", documentId],
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-documents"] });
      toast.success("Règlement enregistré.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer le règlement."),
      ),
  });
}

export function useDeleteSupplierPayment(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: string) => {
      await apiClient.delete(
        `/purchase-documents/${documentId}/payments/${paymentId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["supplier-payments", documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["purchase-document", documentId],
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-documents"] });
      toast.success("Règlement supprimé.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer le règlement."),
      ),
  });
}
