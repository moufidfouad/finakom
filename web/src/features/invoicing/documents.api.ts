import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  CreateDocumentInput,
  SalesDocument,
  UpdateDocumentInput,
} from "@/types";
import { checkClientCreditStatus } from "./clients.api";

export function useDocuments(
  companyId: string | undefined,
  filters: { type?: string; status?: string } = {},
) {
  return useQuery({
    queryKey: ["documents", companyId, filters],
    queryFn: async (): Promise<SalesDocument[]> =>
      (
        await apiClient.get(`/companies/${companyId}/documents`, {
          params: filters,
        })
      ).data,
    enabled: !!companyId,
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: async (): Promise<SalesDocument> =>
      (await apiClient.get(`/documents/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateDocument(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDocumentInput): Promise<SalesDocument> =>
      (await apiClient.post(`/companies/${companyId}/documents`, input)).data,
    onSuccess: async (doc) => {
      queryClient.invalidateQueries({ queryKey: ["documents", companyId] });
      toast.success(`${doc.type} ${doc.number} créé.`);

      // Avertissement non bloquant — la facture est déjà créée, on informe
      // seulement si elle fait dépasser l'encours autorisé du client (voir
      // creditLimitEngine.ts côté backend : jamais un blocage, un simple signal).
      if (doc.type === "Facture") {
        try {
          const status = await checkClientCreditStatus(doc.clientId, 0);
          if (status.wouldExceed) {
            toast.error(
              `⚠️ Encours dépassé pour ${doc.client.name} : ${status.projectedOutstanding.toLocaleString("fr-FR")} pour une limite de ${status.creditLimit?.toLocaleString("fr-FR")} (dépassement de ${status.excessAmount.toLocaleString("fr-FR")}).`,
            );
          }
        } catch {
          // Vérification best-effort — un échec ne doit jamais perturber la création de la facture déjà réussie.
        }
      }
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de créer le document.")),
  });
}

export function useUpdateDocument(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateDocumentInput;
    }): Promise<SalesDocument> =>
      (await apiClient.put(`/documents/${id}`, input)).data,
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["documents", companyId] });
      queryClient.invalidateQueries({ queryKey: ["document", doc.id] });
      toast.success(`${doc.type} ${doc.number} mis à jour.`);
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de modifier le document."),
      ),
  });
}

export function useUpdateDocumentStatus(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: string): Promise<SalesDocument> =>
      (await apiClient.patch(`/documents/${documentId}/status`, { status }))
        .data,
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success(`Statut mis à jour : ${doc.status}.`);
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de mettre à jour le statut."),
      ),
  });
}

export function useDeliverLine(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lineId,
      quantityDelivered,
    }: {
      lineId: string;
      quantityDelivered: number;
    }): Promise<SalesDocument> =>
      (
        await apiClient.patch(
          `/documents/${documentId}/lines/${lineId}/deliver`,
          { quantityDelivered },
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Ligne livrée : stock mis à jour.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de mettre à jour la livraison."),
      ),
  });
}

export function useConvertToInvoice(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quoteId: string): Promise<SalesDocument> =>
      (await apiClient.post(`/documents/${quoteId}/convert-to-invoice`)).data,
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["documents", companyId] });
      toast.success(`Devis converti en facture ${invoice.number}.`);
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de convertir le devis en facture."),
      ),
  });
}

export function useCreateDeliveryNoteFromInvoice(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId: string): Promise<SalesDocument> =>
      (await apiClient.post(`/documents/${invoiceId}/create-delivery-note`))
        .data,
    onSuccess: (deliveryNote) => {
      queryClient.invalidateQueries({ queryKey: ["documents", companyId] });
      toast.success(
        `Bon de livraison ${deliveryNote.number} créé depuis la facture.`,
      );
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de créer le bon de livraison."),
      ),
  });
}

export function useDeleteDocument(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", companyId] });
      toast.success("Document supprimé.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer le document."),
      ),
  });
}
