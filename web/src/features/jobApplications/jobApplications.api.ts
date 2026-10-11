import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { candidateApiClient } from "@/lib/candidateAxios";
import { apiClient } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/lib/toast";
import {
  CandidateJobApplication,
  JobApplication,
  JobApplicationStatus,
} from "@/types";

export function useCandidateApplications() {
  return useQuery({
    queryKey: ["candidate-applications"],
    queryFn: async (): Promise<CandidateJobApplication[]> =>
      (await candidateApiClient.get("/candidate/applications")).data,
  });
}

export function useCreateJobApplication(jobPostingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cvId: string) =>
      (
        await candidateApiClient.post(
          `/candidate/job-postings/${jobPostingId}/apply`,
          { cvId },
        )
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["candidate-applications"] }),
  });
}

// ---------- Espace entreprise ----------

export function useApplicationsForJobPosting(
  companyId: string,
  jobPostingId: string | undefined,
) {
  return useQuery({
    queryKey: ["job-posting-applications", jobPostingId],
    queryFn: async (): Promise<JobApplication[]> =>
      (
        await apiClient.get(
          `/companies/${companyId}/job-postings/${jobPostingId}/applications`,
        )
      ).data,
    enabled: !!jobPostingId,
  });
}

export function useUpdateJobApplicationStatus(
  companyId: string,
  jobPostingId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: JobApplicationStatus;
    }) =>
      (
        await apiClient.patch(
          `/companies/${companyId}/job-applications/${id}/status`,
          { status },
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["job-posting-applications", jobPostingId],
      });
      toast.success("Statut mis à jour.");
    },
    onError: (err) =>
      toast.error(
        getApiErrorMessage(err, "Impossible de mettre à jour le statut."),
      ),
  });
}
