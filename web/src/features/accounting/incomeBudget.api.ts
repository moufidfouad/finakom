import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { toast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/apiError';
import { IncomeBudgetComparison, IncomeBudgetLine, IncomeBudgetLineInput } from '@/types';

export function useIncomeBudgetLines(companyId: string | undefined, fiscalYear: number) {
  return useQuery({
    queryKey: ['income-budget', companyId, fiscalYear],
    queryFn: async (): Promise<IncomeBudgetLine[]> =>
      (await apiClient.get(`/companies/${companyId}/accounting/income-budget`, { params: { fiscalYear } })).data,
    enabled: !!companyId,
  });
}

export function useIncomeBudgetComparison(companyId: string | undefined, fiscalYear: number) {
  return useQuery({
    queryKey: ['income-budget-comparison', companyId, fiscalYear],
    queryFn: async (): Promise<IncomeBudgetComparison> =>
      (await apiClient.get(`/companies/${companyId}/accounting/income-budget-comparison`, { params: { fiscalYear } })).data,
    enabled: !!companyId,
  });
}

export function useUpsertIncomeBudgetLine(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: IncomeBudgetLineInput) => (await apiClient.post(`/companies/${companyId}/accounting/income-budget`, input)).data,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['income-budget', companyId, variables.fiscalYear] });
      queryClient.invalidateQueries({ queryKey: ['income-budget-comparison', companyId, variables.fiscalYear] });
      toast.success('Budget mis à jour.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Impossible de mettre à jour le budget.')),
  });
}
