import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { Company, CompanyInput } from "@/types";

const companiesApi = {
  list: async (): Promise<Company[]> =>
    (await apiClient.get("/companies")).data,
  get: async (id: string): Promise<Company> =>
    (await apiClient.get(`/companies/${id}`)).data,
  create: async (input: CompanyInput): Promise<Company> =>
    (await apiClient.post("/companies", input)).data,
  update: async (id: string, input: Partial<CompanyInput>): Promise<Company> =>
    (await apiClient.put(`/companies/${id}`, input)).data,
  updateDirectorySettings: async (
    id: string,
    input: {
      directoryVisibility: "Brouillon" | "Public";
      publicDescription?: string;
    },
  ): Promise<Company> =>
    (await apiClient.patch(`/companies/${id}/directory-settings`, input)).data,
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },
};

export function useCompanies() {
  return useQuery({ queryKey: ["companies"], queryFn: companiesApi.list });
}
export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: ["companies", id],
    queryFn: () => companiesApi.get(id as string),
    enabled: !!id,
  });
}
export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Entreprise créée avec succès.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de créer l'entreprise.")),
  });
}
export function useUpdateCompany(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CompanyInput>) =>
      companiesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companies", id] });
      toast.success("Entreprise mise à jour.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de modifier l'entreprise."),
      ),
  });
}

export function useUpdateDirectorySettings(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      directoryVisibility: "Brouillon" | "Public";
      publicDescription?: string;
    }) => companiesApi.updateDirectorySettings(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", id] });
      toast.success("Réglages de l'annuaire mis à jour.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de mettre à jour les réglages."),
      ),
  });
}
export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companiesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Entreprise supprimée.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer l'entreprise."),
      ),
  });
}

export function useUploadCompanyLogo(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<Company> => {
      const formData = new FormData();
      formData.append("logo", file);
      const { data } = await apiClient.post(
        `/companies/${companyId}/logo`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", companyId] });
      toast.success(
        "Logo mis à jour — il apparaîtra sur les prochains documents générés.",
      );
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible d'envoyer le logo.")),
  });
}

export function useDeleteCompanyLogo(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<Company> =>
      (await apiClient.delete(`/companies/${companyId}/logo`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", companyId] });
      toast.success("Logo retiré.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de retirer le logo.")),
  });
}
