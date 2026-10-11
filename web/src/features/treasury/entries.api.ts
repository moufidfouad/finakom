import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { TreasuryEntry, TreasuryEntryInput } from "@/types";

export function useTreasuryEntries(companyId: string | undefined) {
  return useQuery({
    queryKey: ["treasury-entries", companyId],
    queryFn: async (): Promise<TreasuryEntry[]> =>
      (await apiClient.get(`/companies/${companyId}/treasury/entries`)).data,
    enabled: !!companyId,
  });
}

export function useCreateTreasuryEntry(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TreasuryEntryInput) =>
      (await apiClient.post(`/companies/${companyId}/treasury/entries`, input))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["treasury-entries", companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["treasury-dashboard", companyId],
      });
      toast.success("Écriture enregistrée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer l'écriture."),
      ),
  });
}

export function useUpdateTreasuryEntry(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<TreasuryEntryInput>;
    }) => (await apiClient.put(`/treasury/entries/${id}`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["treasury-entries", companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["treasury-dashboard", companyId],
      });
      toast.success("Écriture mise à jour.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(
          err,
          "Impossible de modifier cette écriture — vérifiez que vous en êtes le créateur ou administrateur de l'entreprise.",
        ),
      ),
  });
}

export function useDeleteTreasuryEntry(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/treasury/entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["treasury-entries", companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["treasury-dashboard", companyId],
      });
      toast.success("Écriture supprimée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer cette écriture."),
      ),
  });
}
