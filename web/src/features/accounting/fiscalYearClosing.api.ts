import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { FiscalYearClosing } from "@/types";

export function useFiscalYears(companyId: string | undefined) {
  return useQuery({
    queryKey: ["fiscal-years", companyId],
    queryFn: async (): Promise<FiscalYearClosing[]> =>
      (await apiClient.get(`/companies/${companyId}/accounting/fiscal-years`))
        .data,
    enabled: !!companyId,
  });
}

export function useCloseFiscalYear(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fiscalYear: number): Promise<FiscalYearClosing> =>
      (
        await apiClient.post(
          `/companies/${companyId}/accounting/fiscal-years/close`,
          { fiscalYear },
        )
      ).data,
    onSuccess: (closing) => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-years", companyId] });
      queryClient.invalidateQueries({
        queryKey: ["journal-entries", companyId],
      });
      queryClient.invalidateQueries({ queryKey: ["trial-balance", companyId] });
      queryClient.invalidateQueries({
        queryKey: ["chart-of-accounts", companyId],
      });
      toast.success(
        `Exercice ${closing.fiscalYear} clôturé — résultat net : ${Number(closing.netResult).toLocaleString("fr-FR")}.`,
      );
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de clôturer l'exercice."),
      ),
  });
}
