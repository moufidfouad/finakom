import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { Supplier, SupplierInput } from "@/types";

export function useSuppliers(companyId: string | undefined) {
  return useQuery({
    queryKey: ["suppliers", companyId],
    queryFn: async (): Promise<Supplier[]> =>
      (await apiClient.get(`/companies/${companyId}/suppliers`)).data,
    enabled: !!companyId,
  });
}

export function useCreateSupplier(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SupplierInput) =>
      (await apiClient.post(`/companies/${companyId}/suppliers`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", companyId] });
      toast.success("Fournisseur ajouté.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'ajouter le fournisseur."),
      ),
  });
}

export function useUpdateSupplier(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<SupplierInput>;
    }) => (await apiClient.put(`/suppliers/${id}`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", companyId] });
      toast.success("Fournisseur mis à jour.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de modifier le fournisseur."),
      ),
  });
}

export function useDeleteSupplier(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", companyId] });
      toast.success("Fournisseur supprimé.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer le fournisseur."),
      ),
  });
}
