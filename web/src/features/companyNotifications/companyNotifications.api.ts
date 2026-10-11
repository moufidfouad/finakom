import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { CompanyNotification } from "@/types";

export function notificationsKey(companyId: string | undefined) {
  return ["company-notifications", companyId];
}

export function useCompanyNotifications(companyId: string | undefined) {
  return useQuery({
    queryKey: notificationsKey(companyId),
    queryFn: async (): Promise<CompanyNotification[]> =>
      (await apiClient.get(`/companies/${companyId}/notifications`)).data,
    enabled: !!companyId,
    // Même compromis que côté candidat : pas de push serveur→client dans ce
    // projet, un polling rapproché reste la meilleure approximation possible
    // d'un affichage "instantané" côté in-app.
    refetchInterval: 15_000,
  });
}

export function useMarkCompanyNotificationRead(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) =>
      (
        await apiClient.patch(
          `/companies/${companyId}/notifications/${notificationId}/read`,
        )
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: notificationsKey(companyId) }),
  });
}
