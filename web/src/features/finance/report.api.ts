import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { toast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/apiError';
import { FullReport } from '@/types';

export function useFullReport(analysisId: string | undefined) {
  return useQuery({
    queryKey: ['report', analysisId],
    queryFn: async (): Promise<FullReport> => (await apiClient.get(`/analyses/${analysisId}/rapport-complet`)).data,
    enabled: !!analysisId,
    retry: false,
  });
}

export function useImportBalance(analysisId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiClient.post(`/analyses/${analysisId}/balance/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      toast.success('Balance importée : rapport recalculé.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Échec de l'import de la balance.")),
  });
}

/** Calcule la balance directement depuis les écritures comptables déjà postées
 * (module Comptabilité générale) plutôt que depuis un fichier importé. */
export function useGenerateBalanceFromLedger(analysisId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await apiClient.post(`/analyses/${analysisId}/balance/generate-from-ledger`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report', analysisId] });
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      toast.success('Balance générée depuis la comptabilité : rapport recalculé.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Impossible de générer la balance depuis la comptabilité.')),
  });
}
