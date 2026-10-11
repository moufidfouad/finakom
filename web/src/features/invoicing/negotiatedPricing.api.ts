import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { NegotiatedPrice, ResolvedPrice } from "@/types";

export function useNegotiatedPrices(clientId: string | undefined) {
  return useQuery({
    queryKey: ["negotiated-prices", clientId],
    queryFn: async (): Promise<NegotiatedPrice[]> =>
      (await apiClient.get(`/clients/${clientId}/negotiated-prices`)).data,
    enabled: !!clientId,
  });
}

export function useUpsertNegotiatedPrice(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      productId: string;
      unitPriceHT: number;
      notes?: string;
    }): Promise<NegotiatedPrice> =>
      (await apiClient.post(`/clients/${clientId}/negotiated-prices`, input))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["negotiated-prices", clientId],
      });
      toast.success("Prix négocié enregistré.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer ce prix négocié."),
      ),
  });
}

export function useDeleteNegotiatedPrice(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (priceId: string) => {
      await apiClient.delete(
        `/clients/${clientId}/negotiated-prices/${priceId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["negotiated-prices", clientId],
      });
      toast.success("Prix négocié retiré.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de retirer ce prix négocié."),
      ),
  });
}

/** Fonction impérative — appelée par DocumentForm au moment où l'utilisateur
 * choisit un article, pour proposer le bon prix par défaut (négocié > remise
 * client > catalogue). Ne fait jamais échouer la sélection en cas d'erreur :
 * l'appelant garde le prix catalogue déjà posé en repli. */
export async function resolveEffectivePrice(
  clientId: string,
  productId: string,
): Promise<ResolvedPrice> {
  const { data } = await apiClient.get(
    `/clients/${clientId}/negotiated-prices/resolve/${productId}`,
  );
  return data;
}
