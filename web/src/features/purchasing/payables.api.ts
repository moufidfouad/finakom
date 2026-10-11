import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { AgingReport } from '@/types';

export function usePayablesReport(companyId: string | undefined) {
  return useQuery({
    queryKey: ['payables-report', companyId],
    queryFn: async (): Promise<AgingReport> => (await apiClient.get(`/companies/${companyId}/purchasing/payables`)).data,
    enabled: !!companyId,
  });
}
