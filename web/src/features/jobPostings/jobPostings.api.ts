import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/lib/toast";
import { JobPosting, JobPostingInput, JobPostingStatus } from "@/types";

export function useJobPostings(companyId: string | undefined) {
  return useQuery({
    queryKey: ["job-postings", companyId],
    queryFn: async (): Promise<JobPosting[]> =>
      (await apiClient.get(`/companies/${companyId}/job-postings`)).data,
    enabled: !!companyId,
  });
}

export function useCreateJobPosting(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: JobPostingInput) =>
      (await apiClient.post(`/companies/${companyId}/job-postings`, input))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-postings", companyId] });
      toast.success("Offre publiée.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de publier l'offre.")),
  });
}

export function useUpdateJobPosting(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: JobPostingInput }) =>
      (await apiClient.put(`/companies/${companyId}/job-postings/${id}`, input))
        .data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-postings", companyId] });
      toast.success("Offre mise à jour.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de mettre à jour l'offre."),
      ),
  });
}

export function useUpdateJobPostingStatus(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: JobPostingStatus;
    }) =>
      (
        await apiClient.patch(
          `/companies/${companyId}/job-postings/${id}/status`,
          { status },
        )
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["job-postings", companyId] }),
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de changer le statut de l'offre."),
      ),
  });
}

export function useDeleteJobPosting(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      apiClient.delete(`/companies/${companyId}/job-postings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-postings", companyId] });
      toast.success("Offre supprimée.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de supprimer l'offre.")),
  });
}
