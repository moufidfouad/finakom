import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { HrDashboard } from "@/types";

export function useHrDashboard(companyId: string | undefined) {
  return useQuery({
    queryKey: ["hr-dashboard", companyId],
    queryFn: async (): Promise<HrDashboard> =>
      (await apiClient.get(`/companies/${companyId}/hr/dashboard`)).data,
    enabled: !!companyId,
  });
}
