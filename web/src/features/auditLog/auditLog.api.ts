import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { AuditLogEntry } from "@/types";

export function useAuditLog(
  companyId: string | undefined,
  entityType?: string,
) {
  return useQuery({
    queryKey: ["audit-log", companyId, entityType],
    queryFn: async (): Promise<AuditLogEntry[]> =>
      (
        await apiClient.get(`/companies/${companyId}/audit-log`, {
          params: entityType ? { entityType } : {},
        })
      ).data,
    enabled: !!companyId,
  });
}
