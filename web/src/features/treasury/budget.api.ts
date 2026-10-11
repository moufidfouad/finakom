import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { TreasuryBudgetLine, TreasuryBudgetLineInput } from "@/types";

export function useTreasuryBudgetLines(
  companyId: string | undefined,
  fiscalYear: number,
) {
  return useQuery({
    queryKey: ["treasury-budget", companyId, fiscalYear],
    queryFn: async (): Promise<TreasuryBudgetLine[]> =>
      (
        await apiClient.get(`/companies/${companyId}/treasury/budget`, {
          params: { fiscalYear },
        })
      ).data,
    enabled: !!companyId,
  });
}

export function useUpsertBudgetLine(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TreasuryBudgetLineInput) =>
      (await apiClient.post(`/companies/${companyId}/treasury/budget`, input))
        .data,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["treasury-budget", companyId, variables.fiscalYear],
      });
      queryClient.invalidateQueries({
        queryKey: ["treasury-dashboard", companyId],
      });
      toast.success("Budget mis à jour.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de mettre à jour le budget."),
      ),
  });
}
