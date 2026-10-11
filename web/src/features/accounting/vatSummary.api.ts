import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { VatSummary } from "@/types";

export function useVatSummary(
  companyId: string | undefined,
  periodStart: string,
  periodEnd: string,
) {
  return useQuery({
    queryKey: ["vat-summary", companyId, periodStart, periodEnd],
    queryFn: async (): Promise<VatSummary> =>
      (
        await apiClient.get(`/companies/${companyId}/accounting/vat-summary`, {
          params: { periodStart, periodEnd },
        })
      ).data,
    enabled: !!companyId,
  });
}
