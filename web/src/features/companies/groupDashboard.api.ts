import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { GroupDashboard } from "@/types";

export function useGroupDashboard() {
  return useQuery({
    queryKey: ["group-dashboard"],
    queryFn: async (): Promise<GroupDashboard> =>
      (await apiClient.get("/group-dashboard")).data,
  });
}
