import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  AccountLedger,
  CreateManualEntryInput,
  JournalEntry,
  TrialBalanceLine,
} from "@/types";

export function useJournalEntries(
  companyId: string | undefined,
  journal?: string,
) {
  return useQuery({
    queryKey: ["journal-entries", companyId, journal],
    queryFn: async (): Promise<JournalEntry[]> =>
      (
        await apiClient.get(
          `/companies/${companyId}/accounting/journal-entries`,
          { params: journal ? { journal } : {} },
        )
      ).data,
    enabled: !!companyId,
  });
}

export function useCreateManualEntry(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateManualEntryInput): Promise<JournalEntry> =>
      (
        await apiClient.post(
          `/companies/${companyId}/accounting/journal-entries`,
          input,
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["journal-entries", companyId],
      });
      toast.success("Écriture enregistrée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(
          err,
          "Impossible d'enregistrer l'écriture — vérifiez l'équilibre débit/crédit.",
        ),
      ),
  });
}

export function useDeleteJournalEntry(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/accounting/journal-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["journal-entries", companyId],
      });
      toast.success("Écriture supprimée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer cette écriture."),
      ),
  });
}

export function useAccountLedger(accountId: string | undefined) {
  return useQuery({
    queryKey: ["account-ledger", accountId],
    queryFn: async (): Promise<AccountLedger> =>
      (await apiClient.get(`/accounting/chart-of-accounts/${accountId}/ledger`))
        .data,
    enabled: !!accountId,
  });
}

export function useTrialBalance(
  companyId: string | undefined,
  params: {
    periodNStart: string;
    periodNEnd: string;
    periodN1Start?: string;
    periodN1End?: string;
  } | null,
) {
  return useQuery({
    queryKey: ["trial-balance", companyId, params],
    queryFn: async (): Promise<TrialBalanceLine[]> =>
      (
        await apiClient.get(
          `/companies/${companyId}/accounting/trial-balance`,
          { params },
        )
      ).data,
    enabled: !!companyId && !!params,
  });
}
