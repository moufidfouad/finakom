import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { AgingReport } from "@/types";

export function useCollectionsReport(companyId: string | undefined) {
  return useQuery({
    queryKey: ["collections-report", companyId],
    queryFn: async (): Promise<AgingReport> =>
      (await apiClient.get(`/companies/${companyId}/invoicing/collections`))
        .data,
    enabled: !!companyId,
  });
}
