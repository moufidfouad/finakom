import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { CompanyMember, CompanyRole, CreateMemberInput } from "@/types";

export function useCompanyMembers(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-members", companyId],
    queryFn: async (): Promise<CompanyMember[]> =>
      (await apiClient.get(`/companies/${companyId}/members`)).data,
    enabled: !!companyId,
  });
}

export function useCreateCompanyMember(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMemberInput) =>
      (await apiClient.post(`/companies/${companyId}/members`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-members", companyId],
      });
      toast.success("Membre ajouté à l'entreprise.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible d'ajouter ce membre.")),
  });
}

export function useUpdateCompanyMemberRole(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: CompanyRole;
    }) =>
      (
        await apiClient.patch(`/companies/${companyId}/members/${userId}`, {
          role,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-members", companyId],
      });
      toast.success("Rôle mis à jour.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de modifier ce rôle.")),
  });
}

export function useRemoveCompanyMember(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/companies/${companyId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["company-members", companyId],
      });
      toast.success("Membre retiré.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de retirer ce membre.")),
  });
}
