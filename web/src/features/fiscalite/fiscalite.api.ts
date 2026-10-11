import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/lib/toast";
import {
  BusinessLicenseInput,
  BusinessLicenseSummary,
  CorporateTaxInput,
  CorporateTaxSummary,
  FiscalDeadline,
  FiscalRecap,
  PayrollTaxMonthInput,
  PayrollTaxMonthSummary,
  TaxSettings,
  TaxSettingsInput,
  VatMonthInput,
  VatMonthSummary,
} from "@/types";

// ---- Paramètres ----
export function useTaxSettings(companyId: string | undefined) {
  return useQuery({
    queryKey: ["tax-settings", companyId],
    queryFn: async (): Promise<TaxSettings> =>
      (await apiClient.get(`/companies/${companyId}/fiscalite/settings`)).data,
    enabled: !!companyId,
  });
}

export function useUpdateTaxSettings(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TaxSettingsInput): Promise<TaxSettings> =>
      (await apiClient.put(`/companies/${companyId}/fiscalite/settings`, input))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-settings", companyId] });
      // Tous les calculs dépendent des taux — invalider largement plutôt que
      // d'énumérer chaque clé, pour ne jamais oublier un module au fil des
      // évolutions futures de ce fichier.
      queryClient.invalidateQueries({ queryKey: ["vat-year"] });
      queryClient.invalidateQueries({ queryKey: ["corporate-tax"] });
      queryClient.invalidateQueries({ queryKey: ["business-license"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-tax-year"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["fiscal-recap"] });
      toast.success("Paramètres fiscaux mis à jour.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de mettre à jour les paramètres."),
      ),
  });
}

// ---- TVA ----
export function useVatYear(companyId: string | undefined, year: number) {
  return useQuery({
    queryKey: ["vat-year", companyId, year],
    queryFn: async (): Promise<VatMonthSummary[]> =>
      (
        await apiClient.get(`/companies/${companyId}/fiscalite/tva`, {
          params: { year },
        })
      ).data,
    enabled: !!companyId,
  });
}

export function useUpsertVatMonth(companyId: string, year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: VatMonthInput) =>
      (await apiClient.put(`/companies/${companyId}/fiscalite/tva`, input))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["vat-year", companyId, year],
      });
      queryClient.invalidateQueries({
        queryKey: ["fiscal-calendar", companyId, year],
      });
      queryClient.invalidateQueries({
        queryKey: ["fiscal-recap", companyId, year],
      });
      toast.success("Déclaration TVA enregistrée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer la déclaration."),
      ),
  });
}

// ---- Impôt sur les sociétés ----
export function useCorporateTax(
  companyId: string | undefined,
  fiscalYear: number,
) {
  return useQuery({
    queryKey: ["corporate-tax", companyId, fiscalYear],
    queryFn: async (): Promise<CorporateTaxSummary> =>
      (
        await apiClient.get(`/companies/${companyId}/fiscalite/is`, {
          params: { fiscalYear },
        })
      ).data,
    enabled: !!companyId,
  });
}

export function useUpsertCorporateTax(companyId: string, fiscalYear: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CorporateTaxInput) =>
      (await apiClient.put(`/companies/${companyId}/fiscalite/is`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["corporate-tax", companyId, fiscalYear],
      });
      queryClient.invalidateQueries({
        queryKey: ["fiscal-calendar", companyId, fiscalYear],
      });
      queryClient.invalidateQueries({
        queryKey: ["fiscal-recap", companyId, fiscalYear],
      });
      toast.success("Déclaration IS enregistrée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer la déclaration."),
      ),
  });
}

// ---- Patente ----
export function useBusinessLicense(
  companyId: string | undefined,
  fiscalYear: number,
  monthsLate = 0,
) {
  return useQuery({
    queryKey: ["business-license", companyId, fiscalYear, monthsLate],
    queryFn: async (): Promise<BusinessLicenseSummary> =>
      (
        await apiClient.get(`/companies/${companyId}/fiscalite/patente`, {
          params: { fiscalYear, monthsLate },
        })
      ).data,
    enabled: !!companyId,
  });
}

export function useUpsertBusinessLicense(
  companyId: string,
  fiscalYear: number,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BusinessLicenseInput) =>
      (await apiClient.put(`/companies/${companyId}/fiscalite/patente`, input))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["business-license", companyId, fiscalYear],
      });
      queryClient.invalidateQueries({
        queryKey: ["fiscal-calendar", companyId, fiscalYear],
      });
      queryClient.invalidateQueries({
        queryKey: ["fiscal-recap", companyId, fiscalYear],
      });
      toast.success("Patente enregistrée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer la patente."),
      ),
  });
}

// ---- CNPS & IR sur salaires ----
export function usePayrollTaxYear(companyId: string | undefined, year: number) {
  return useQuery({
    queryKey: ["payroll-tax-year", companyId, year],
    queryFn: async (): Promise<PayrollTaxMonthSummary[]> =>
      (
        await apiClient.get(`/companies/${companyId}/fiscalite/cnps-ir`, {
          params: { year },
        })
      ).data,
    enabled: !!companyId,
  });
}

export function useUpsertPayrollTaxMonth(companyId: string, year: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PayrollTaxMonthInput) =>
      (await apiClient.put(`/companies/${companyId}/fiscalite/cnps-ir`, input))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payroll-tax-year", companyId, year],
      });
      queryClient.invalidateQueries({
        queryKey: ["fiscal-calendar", companyId, year],
      });
      queryClient.invalidateQueries({
        queryKey: ["fiscal-recap", companyId, year],
      });
      toast.success("Charges sociales enregistrées.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer les charges."),
      ),
  });
}

// ---- Calendrier et récapitulatif (dérivés, lecture seule) ----
export function useFiscalCalendar(companyId: string | undefined, year: number) {
  return useQuery({
    queryKey: ["fiscal-calendar", companyId, year],
    queryFn: async (): Promise<FiscalDeadline[]> =>
      (
        await apiClient.get(`/companies/${companyId}/fiscalite/calendrier`, {
          params: { year },
        })
      ).data,
    enabled: !!companyId,
  });
}

export function useFiscalRecap(companyId: string | undefined, year: number) {
  return useQuery({
    queryKey: ["fiscal-recap", companyId, year],
    queryFn: async (): Promise<FiscalRecap> =>
      (
        await apiClient.get(`/companies/${companyId}/fiscalite/recapitulatif`, {
          params: { year },
        })
      ).data,
    enabled: !!companyId,
  });
}
