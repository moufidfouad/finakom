import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { InvoicingDashboard } from "@/types";

export function useInvoicingDashboard(companyId: string | undefined) {
  return useQuery({
    queryKey: ["invoicing-dashboard", companyId],
    queryFn: async (): Promise<InvoicingDashboard> =>
      (await apiClient.get(`/companies/${companyId}/invoicing/dashboard`)).data,
    enabled: !!companyId,
  });
}
