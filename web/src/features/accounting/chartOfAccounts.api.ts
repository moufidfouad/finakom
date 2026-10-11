import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { ChartOfAccount, CreateAccountInput } from "@/types";

export function useChartOfAccounts(companyId: string | undefined) {
  return useQuery({
    queryKey: ["chart-of-accounts", companyId],
    queryFn: async (): Promise<ChartOfAccount[]> =>
      (
        await apiClient.get(
          `/companies/${companyId}/accounting/chart-of-accounts`,
        )
      ).data,
    enabled: !!companyId,
  });
}

export function useSeedDefaultAccounts(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<ChartOfAccount[]> =>
      (
        await apiClient.post(
          `/companies/${companyId}/accounting/chart-of-accounts/seed-default`,
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chart-of-accounts", companyId],
      });
      toast.success("Trame de plan comptable SYSCOHADA appliquée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'appliquer la trame standard."),
      ),
  });
}

export function useCreateAccount(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAccountInput): Promise<ChartOfAccount> =>
      (
        await apiClient.post(
          `/companies/${companyId}/accounting/chart-of-accounts`,
          input,
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chart-of-accounts", companyId],
      });
      toast.success("Compte ajouté au plan comptable.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible d'ajouter ce compte.")),
  });
}
