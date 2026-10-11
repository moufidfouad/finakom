import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { Client, ClientInput, CreditStatus } from "@/types";

export function useClients(companyId: string | undefined) {
  return useQuery({
    queryKey: ["clients", companyId],
    queryFn: async (): Promise<Client[]> =>
      (await apiClient.get(`/companies/${companyId}/clients`)).data,
    enabled: !!companyId,
  });
}

export function useCreateClient(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientInput) =>
      (await apiClient.post(`/companies/${companyId}/clients`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      toast.success("Client ajouté.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible d'ajouter le client.")),
  });
}

export function useUpdateClient(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ClientInput>;
    }) => (await apiClient.put(`/clients/${id}`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      toast.success("Client mis à jour.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de modifier le client.")),
  });
}

export function useDeleteClient(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", companyId] });
      toast.success("Client supprimé.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de supprimer le client."),
      ),
  });
}

/** Fonction impérative (pas un hook réactif) — appelée juste avant de créer
 * une facture pour prévisualiser l'impact sur l'encours du client, sans
 * jamais bloquer la création elle-même (voir creditLimitEngine.ts côté backend). */
export async function checkClientCreditStatus(
  clientId: string,
  newInvoiceAmount: number,
): Promise<CreditStatus> {
  const { data } = await apiClient.get(`/clients/${clientId}/credit-status`, {
    params: { amount: newInvoiceAmount },
  });
  return data;
}

/** Version réactive, pour l'affichage permanent de l'encours d'un client (ex:
 * badge dans la liste des clients) — n'est activée QUE si `enabled` est vrai,
 * pour ne jamais interroger inutilement les clients sans limite configurée. */
export function useClientCreditStatus(clientId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["client-credit-status", clientId],
    queryFn: () => checkClientCreditStatus(clientId, 0),
    enabled,
  });
}
