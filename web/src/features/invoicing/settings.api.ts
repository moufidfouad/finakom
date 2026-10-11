import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { InvoicingSettings } from "@/types";

export interface InvoicingSettingsInput {
  tvaRatePercent?: number;
  quoteValidityDays?: number;
  paymentTermsDays?: number;
  latePenaltyRatePercent?: number;
  cashDiscountRatePercent?: number;
  vatMention?: string;
  paymentConditions?: string;
  deliveryConditions?: string;
  legalMention?: string;
  warranty?: string;
  bankDetails?: string;
}

export function useInvoicingSettings(companyId: string | undefined) {
  return useQuery({
    queryKey: ["invoicing-settings", companyId],
    queryFn: async (): Promise<InvoicingSettings> =>
      (await apiClient.get(`/companies/${companyId}/invoicing/settings`)).data,
    enabled: !!companyId,
  });
}

export function useUpdateInvoicingSettings(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: InvoicingSettingsInput,
    ): Promise<InvoicingSettings> =>
      (await apiClient.put(`/companies/${companyId}/invoicing/settings`, input))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["invoicing-settings", companyId],
      });
      toast.success("Paramètres de facturation enregistrés.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer les paramètres."),
      ),
  });
}
