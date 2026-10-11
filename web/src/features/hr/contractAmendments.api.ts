import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";
import { ContractAmendment, CreateAmendmentInput } from "@/types";

export function useContractAmendments(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["contract-amendments", employeeId],
    queryFn: async (): Promise<ContractAmendment[]> =>
      (await apiClient.get(`/employees/${employeeId}/contract-amendments`))
        .data,
    enabled: !!employeeId,
  });
}

export function useCreateAmendment(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: CreateAmendmentInput,
    ): Promise<ContractAmendment> =>
      (
        await apiClient.post(
          `/employees/${employeeId}/contract-amendments`,
          input,
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contract-amendments", employeeId],
      });
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
      toast.success("Avenant enregistré — la fiche employé a été mise à jour.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible d'enregistrer l'avenant."),
      ),
  });
}
