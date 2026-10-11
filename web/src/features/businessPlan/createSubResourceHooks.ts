import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { toast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/apiError';

/**
 * Les six sous-ressources d'un business plan (investissements, financements,
 * fournisseurs, lignes de compte de résultat, lignes de trésorerie, lignes de
 * bilan) partagent exactement la même forme CRUD REST imbriquée sous
 * /business-plans/:planId/<resource>. Fabrique générique plutôt que six copies
 * quasi identiques des mêmes quatre hooks.
 */
export function createBusinessPlanSubResourceHooks<TItem, TInput>(resourcePath: string, queryKeyPrefix: string) {
  function useList(planId: string | undefined) {
    return useQuery({
      queryKey: [queryKeyPrefix, planId],
      queryFn: async (): Promise<TItem[]> => (await apiClient.get(`/business-plans/${planId}/${resourcePath}`)).data,
      enabled: !!planId,
    });
  }

  function useCreate(planId: string) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (input: TInput): Promise<TItem> =>
        (await apiClient.post(`/business-plans/${planId}/${resourcePath}`, input)).data,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, planId] });
        queryClient.invalidateQueries({ queryKey: ['business-plan-summary', planId] });
        toast.success('Ligne ajoutée.');
      },
      onError: (err) => toast.error(getApiErrorMessage(err, "Impossible d'ajouter cette ligne.")),
    });
  }

  function useUpdate(planId: string) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, input }: { id: string; input: Partial<TInput> }): Promise<TItem> =>
        (await apiClient.put(`/business-plans/${planId}/${resourcePath}/${id}`, input)).data,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, planId] });
        queryClient.invalidateQueries({ queryKey: ['business-plan-summary', planId] });
        toast.success('Ligne mise à jour.');
      },
      onError: (err) => toast.error(getApiErrorMessage(err, 'Impossible de modifier cette ligne.')),
    });
  }

  function useDelete(planId: string) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => { await apiClient.delete(`/business-plans/${planId}/${resourcePath}/${id}`); },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, planId] });
        queryClient.invalidateQueries({ queryKey: ['business-plan-summary', planId] });
        toast.success('Ligne supprimée.');
      },
      onError: (err) => toast.error(getApiErrorMessage(err, 'Impossible de supprimer cette ligne.')),
    });
  }

  return { useList, useCreate, useUpdate, useDelete };
}
