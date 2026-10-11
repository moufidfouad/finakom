import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/axios';
import { PaymentJournalEntry } from '@/types';

export function usePaymentsJournal(companyId: string | undefined) {
  return useQuery({
    queryKey: ['payments-journal', companyId],
    queryFn: async (): Promise<PaymentJournalEntry[]> => (await apiClient.get(`/companies/${companyId}/payments-journal`)).data,
    enabled: !!companyId,
  });
}
