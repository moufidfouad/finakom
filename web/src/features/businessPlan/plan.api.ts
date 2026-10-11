import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  BusinessPlan,
  CreateBusinessPlanInput,
  UpdateBusinessPlanInput,
} from "@/types";

export function useBusinessPlans(companyId: string | undefined) {
  return useQuery({
    queryKey: ["business-plans", companyId],
    queryFn: async (): Promise<BusinessPlan[]> =>
      (await apiClient.get(`/companies/${companyId}/business-plans`)).data,
    enabled: !!companyId,
  });
}

export function useBusinessPlan(id: string | undefined) {
  return useQuery({
    queryKey: ["business-plan", id],
    queryFn: async (): Promise<BusinessPlan> =>
      (await apiClient.get(`/business-plans/${id}`)).data,
    enabled: !!id,
  });
}

export function useCreateBusinessPlan(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBusinessPlanInput): Promise<BusinessPlan> =>
      (await apiClient.post(`/companies/${companyId}/business-plans`, input))
        .data,
    onSuccess: (plan) => {
      queryClient.invalidateQueries({
        queryKey: ["business-plans", companyId],
      });
      toast.success(`Business plan "${plan.title}" créé.`);
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de créer le business plan."),
      ),
  });
}

export function useUpdateBusinessPlan(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateBusinessPlanInput;
    }): Promise<BusinessPlan> =>
      (await apiClient.put(`/business-plans/${id}`, input)).data,
    onSuccess: (plan) => {
      queryClient.invalidateQueries({
        queryKey: ["business-plans", companyId],
      });
      queryClient.invalidateQueries({ queryKey: ["business-plan", plan.id] });
      toast.success("Business plan mis à jour.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de modifier le business plan."),
      ),
  });
}

export function useDeleteBusinessPlan(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/business-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["business-plans", companyId],
      });
      toast.success("Business plan supprimé.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer le business plan."),
      ),
  });
}
