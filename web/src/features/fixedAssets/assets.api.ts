import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { FixedAsset, FixedAssetInput } from "@/types";

export function useFixedAssets(companyId: string | undefined) {
  return useQuery({
    queryKey: ["fixed-assets", companyId],
    queryFn: async (): Promise<FixedAsset[]> =>
      (await apiClient.get(`/companies/${companyId}/fixed-assets`)).data,
    enabled: !!companyId,
  });
}

export function useCreateFixedAsset(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FixedAssetInput) =>
      (await apiClient.post(`/companies/${companyId}/fixed-assets`, input))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets", companyId] });
      queryClient.invalidateQueries({
        queryKey: ["fixed-assets-dashboard", companyId],
      });
      toast.success("Immobilisation ajoutée au registre.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'ajouter l'immobilisation."),
      ),
  });
}

export function useUpdateFixedAsset(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<FixedAssetInput>;
    }) => (await apiClient.put(`/fixed-assets/${id}`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets", companyId] });
      queryClient.invalidateQueries({
        queryKey: ["fixed-assets-dashboard", companyId],
      });
      toast.success("Immobilisation mise à jour.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de modifier l'immobilisation."),
      ),
  });
}

export function useDeleteFixedAsset(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/fixed-assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fixed-assets", companyId] });
      queryClient.invalidateQueries({
        queryKey: ["fixed-assets-dashboard", companyId],
      });
      toast.success("Immobilisation supprimée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer l'immobilisation."),
      ),
  });
}
