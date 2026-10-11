import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { Analysis, AnalysisInput } from "@/types";

export function useAnalyses(companyId: string | undefined) {
  return useQuery({
    queryKey: ["analyses", companyId],
    queryFn: async (): Promise<Analysis[]> =>
      (await apiClient.get(`/companies/${companyId}/analyses`)).data,
    enabled: !!companyId,
  });
}
export function useAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: ["analysis", id],
    queryFn: async (): Promise<Analysis> =>
      (await apiClient.get(`/analyses/${id}`)).data,
    enabled: !!id,
  });
}
export function useCreateAnalysis(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AnalysisInput) =>
      (await apiClient.post(`/companies/${companyId}/analyses`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses", companyId] });
      toast.success("Analyse créée.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de créer l'analyse.")),
  });
}
export function useDeleteAnalysis(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/analyses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses", companyId] });
      toast.success("Analyse supprimée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer l'analyse."),
      ),
  });
}
