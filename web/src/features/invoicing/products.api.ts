import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { Product, ProductInput } from "@/types";

export function useProducts(companyId: string | undefined) {
  return useQuery({
    queryKey: ["products", companyId],
    queryFn: async (): Promise<Product[]> =>
      (await apiClient.get(`/companies/${companyId}/products`)).data,
    enabled: !!companyId,
  });
}

export function useCreateProduct(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductInput) =>
      (await apiClient.post(`/companies/${companyId}/products`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", companyId] });
      toast.success("Article ajouté au catalogue.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible d'ajouter l'article.")),
  });
}

export function useUpdateProduct(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ProductInput>;
    }) => (await apiClient.put(`/products/${id}`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", companyId] });
      toast.success("Article mis à jour.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de modifier l'article.")),
  });
}

export function useDeleteProduct(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", companyId] });
      toast.success("Article supprimé.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer l'article."),
      ),
  });
}
