import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  CreatePurchaseDocumentInput,
  PurchaseDocument,
  UpdatePurchaseDocumentInput,
} from "@/types";

export function usePurchaseDocuments(
  companyId: string | undefined,
  filters: { type?: string; status?: string } = {},
) {
  return useQuery({
    queryKey: ["purchase-documents", companyId, filters],
    queryFn: async (): Promise<PurchaseDocument[]> =>
      (
        await apiClient.get(`/companies/${companyId}/purchase-documents`, {
          params: filters,
        })
      ).data,
    enabled: !!companyId,
  });
}

export function usePurchaseDocument(id: string | undefined) {
  return useQuery({
    queryKey: ["purchase-document", id],
    queryFn: async (): Promise<PurchaseDocument> =>
      (await apiClient.get(`/purchase-documents/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreatePurchaseDocument(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: CreatePurchaseDocumentInput,
    ): Promise<PurchaseDocument> =>
      (
        await apiClient.post(
          `/companies/${companyId}/purchase-documents`,
          input,
        )
      ).data,
    onSuccess: (doc) => {
      queryClient.invalidateQueries({
        queryKey: ["purchase-documents", companyId],
      });
      toast.success(`${doc.type} ${doc.number} créé.`);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de créer le document.")),
  });
}

export function useUpdatePurchaseDocument(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdatePurchaseDocumentInput;
    }): Promise<PurchaseDocument> =>
      (await apiClient.put(`/purchase-documents/${id}`, input)).data,
    onSuccess: (doc) => {
      queryClient.invalidateQueries({
        queryKey: ["purchase-documents", companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["purchase-document", doc.id],
      });
      toast.success(`${doc.type} ${doc.number} mis à jour.`);
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de modifier le document."),
      ),
  });
}

export function useUpdatePurchaseDocumentStatus(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: string): Promise<PurchaseDocument> =>
      (
        await apiClient.patch(`/purchase-documents/${documentId}/status`, {
          status,
        })
      ).data,
    onSuccess: (doc) => {
      queryClient.invalidateQueries({
        queryKey: ["purchase-document", documentId],
      });
      queryClient.invalidateQueries({ queryKey: ["purchase-documents"] });
      toast.success(`Statut mis à jour : ${doc.status}.`);
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de mettre à jour le statut."),
      ),
  });
}

export function useConvertOrderToInvoice(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string): Promise<PurchaseDocument> =>
      (
        await apiClient.post(
          `/purchase-documents/${orderId}/convert-to-invoice`,
        )
      ).data,
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({
        queryKey: ["purchase-documents", companyId],
      });
      toast.success(
        `Bon de commande converti en facture fournisseur ${invoice.number}.`,
      );
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de convertir le bon de commande."),
      ),
  });
}

export function useDeletePurchaseDocument(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/purchase-documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["purchase-documents", companyId],
      });
      toast.success("Document supprimé.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer le document."),
      ),
  });
}
