import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { TreasuryDashboard } from "@/types";

export function useTreasuryDashboard(
  companyId: string | undefined,
  fiscalYear: number,
) {
  return useQuery({
    queryKey: ["treasury-dashboard", companyId, fiscalYear],
    queryFn: async (): Promise<TreasuryDashboard> =>
      (
        await apiClient.get(`/companies/${companyId}/treasury/dashboard`, {
          params: { fiscalYear },
        })
      ).data,
    enabled: !!companyId,
  });
}
