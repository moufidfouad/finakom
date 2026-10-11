import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  BankStatementLine,
  ReconciliationSummary,
  SuggestedMatch,
} from "@/types";

export function useStatementLines(
  companyId: string | undefined,
  onlyUnmatched = false,
) {
  return useQuery({
    queryKey: ["bank-statement-lines", companyId, onlyUnmatched],
    queryFn: async (): Promise<BankStatementLine[]> =>
      (
        await apiClient.get(
          `/companies/${companyId}/treasury/reconciliation/lines`,
          { params: { onlyUnmatched } },
        )
      ).data,
    enabled: !!companyId,
  });
}

export function useSuggestedMatches(companyId: string | undefined) {
  return useQuery({
    queryKey: ["bank-reconciliation-suggestions", companyId],
    queryFn: async (): Promise<SuggestedMatch[]> =>
      (
        await apiClient.get(
          `/companies/${companyId}/treasury/reconciliation/suggested-matches`,
        )
      ).data,
    enabled: !!companyId,
  });
}

export function useReconciliationSummary(
  companyId: string | undefined,
  bankStatementBalance: number | null,
) {
  return useQuery({
    queryKey: ["bank-reconciliation-summary", companyId, bankStatementBalance],
    queryFn: async (): Promise<ReconciliationSummary> =>
      (
        await apiClient.get(
          `/companies/${companyId}/treasury/reconciliation/summary`,
          { params: { bankStatementBalance } },
        )
      ).data,
    enabled: !!companyId && bankStatementBalance !== null,
  });
}

export function useImportStatement(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await apiClient.post(
        `/companies/${companyId}/treasury/reconciliation/lines/import`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bank-statement-lines", companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bank-reconciliation-suggestions", companyId],
      });
      toast.success("Relevé bancaire importé.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Échec de l'import du relevé.")),
  });
}

export function useMatchStatementLine(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      statementLineId,
      treasuryEntryId,
    }: {
      statementLineId: string;
      treasuryEntryId: string;
    }) =>
      (
        await apiClient.post(
          `/treasury/reconciliation/lines/${statementLineId}/match`,
          { treasuryEntryId },
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bank-statement-lines", companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bank-reconciliation-suggestions", companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bank-reconciliation-summary", companyId],
      });
      toast.success("Ligne rapprochée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de rapprocher cette ligne."),
      ),
  });
}

export function useUnmatchStatementLine(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (statementLineId: string) =>
      (
        await apiClient.delete(
          `/treasury/reconciliation/lines/${statementLineId}/match`,
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bank-statement-lines", companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bank-reconciliation-suggestions", companyId],
      });
      queryClient.invalidateQueries({
        queryKey: ["bank-reconciliation-summary", companyId],
      });
      toast.success("Rapprochement annulé.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'annuler ce rapprochement."),
      ),
  });
}
