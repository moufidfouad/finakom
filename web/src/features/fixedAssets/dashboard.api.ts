import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { FixedAssetDashboard } from "@/types";

export function useFixedAssetDashboard(companyId: string | undefined) {
  return useQuery({
    queryKey: ["fixed-assets-dashboard", companyId],
    queryFn: async (): Promise<FixedAssetDashboard> =>
      (await apiClient.get(`/companies/${companyId}/fixed-assets/dashboard`))
        .data,
    enabled: !!companyId,
  });
}

/** Comptabilise en une écriture la dotation aux amortissements de l'exercice
 * courant — action explicite et volontaire (voir postDepreciation.service.ts côté backend). */
export function usePostAnnualDepreciation(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{
      fiscalYear: number;
      totalDotation: number;
    }> =>
      (
        await apiClient.post(
          `/companies/${companyId}/fixed-assets/dashboard/post-depreciation`,
        )
      ).data,
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["journal-entries", companyId],
      });
      queryClient.invalidateQueries({ queryKey: ["trial-balance", companyId] });
      toast.success(
        `Dotation de l'exercice ${result.fiscalYear} comptabilisée (${result.totalDotation.toLocaleString("fr-FR")}).`,
      );
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(
          err,
          "Impossible de comptabiliser la dotation — vérifiez le plan comptable.",
        ),
      ),
  });
}
