import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { BusinessPlanSummary } from "@/types";

export function useBusinessPlanSummary(planId: string | undefined) {
  return useQuery({
    queryKey: ["business-plan-summary", planId],
    queryFn: async (): Promise<BusinessPlanSummary> =>
      (await apiClient.get(`/business-plans/${planId}/summary`)).data,
    enabled: !!planId,
  });
}
