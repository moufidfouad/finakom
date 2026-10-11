import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { ConversationReport, Message, PaginatedResponse } from "@/types";

type ReportStatus = "unresolved" | "resolved" | "all";

export function useConversationReports(page: number, status: ReportStatus) {
  return useQuery({
    queryKey: ["admin-conversation-reports", page, status],
    queryFn: async (): Promise<PaginatedResponse<ConversationReport>> =>
      (
        await apiClient.get("/admin/conversation-reports", {
          params: { page, pageSize: 20, status },
        })
      ).data,
  });
}

export function useConversationReportDetail(reportId: string | undefined) {
  return useQuery({
    queryKey: ["admin-conversation-report-detail", reportId],
    queryFn: async (): Promise<{
      report: ConversationReport;
      messages: Message[];
    }> => (await apiClient.get(`/admin/conversation-reports/${reportId}`)).data,
    enabled: !!reportId,
  });
}

export function useResolveConversationReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: string) =>
      (await apiClient.patch(`/admin/conversation-reports/${reportId}/resolve`))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin-conversation-reports"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-conversation-report-detail"],
      });
    },
  });
}
