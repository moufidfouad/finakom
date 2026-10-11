import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { AssetMovement, AssetMovementInput } from "@/types";

export function useAssetMovements(fixedAssetId: string | undefined) {
  return useQuery({
    queryKey: ["asset-movements", fixedAssetId],
    queryFn: async (): Promise<AssetMovement[]> =>
      (await apiClient.get(`/fixed-assets/${fixedAssetId}/movements`)).data,
    enabled: !!fixedAssetId,
  });
}

export function useCompanyAssetMovements(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-asset-movements", companyId],
    queryFn: async (): Promise<AssetMovement[]> =>
      (await apiClient.get(`/companies/${companyId}/fixed-assets/movements`))
        .data,
    enabled: !!companyId,
  });
}

export function useCreateAssetMovement(
  fixedAssetId: string,
  companyId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssetMovementInput) =>
      (await apiClient.post(`/fixed-assets/${fixedAssetId}/movements`, input))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["asset-movements", fixedAssetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["company-asset-movements", companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["fixed-assets-dashboard", companyId],
      });
      toast.success("Mouvement enregistré.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer le mouvement."),
      ),
  });
}

export function useDeleteAssetMovement(
  fixedAssetId: string,
  companyId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movementId: string) => {
      await apiClient.delete(
        `/fixed-assets/${fixedAssetId}/movements/${movementId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["asset-movements", fixedAssetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["company-asset-movements", companyId],
      });
      toast.success("Mouvement supprimé.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
