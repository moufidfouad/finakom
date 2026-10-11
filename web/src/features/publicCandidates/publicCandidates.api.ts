import { useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/apiError";
import { CvFacets, PaginatedResponse, PublicCv } from "@/types";

export interface PublicCvsFilters {
  page: number;
  search?: string;
  skill?: string;
}

export function usePublicCvs(filters: PublicCvsFilters) {
  return useQuery({
    queryKey: ["public-cvs", filters],
    queryFn: async (): Promise<PaginatedResponse<PublicCv>> =>
      (await apiClient.get("/candidates", { params: filters })).data,
    placeholderData: keepPreviousData,
  });
}

export function usePublicCvFacets() {
  return useQuery({
    queryKey: ["public-cvs-facets"],
    queryFn: async (): Promise<CvFacets> =>
      (await apiClient.get("/candidates/facets")).data,
    staleTime: 5 * 60_000,
  });
}

export function usePublicCv(cvId: string | undefined) {
  return useQuery({
    queryKey: ["public-cv", cvId],
    queryFn: async (): Promise<PublicCv> =>
      (await apiClient.get(`/candidates/${cvId}`)).data,
    enabled: !!cvId,
  });
}

export interface ContactCandidateInput {
  senderName: string;
  senderEmail: string;
  message: string;
  website?: string; // honeypot — jamais rempli par un humain, voir backend
}

export function useContactCandidate(cvId: string) {
  return useMutation({
    mutationFn: async (input: ContactCandidateInput) => {
      try {
        return (await apiClient.post(`/candidates/${cvId}/contact`, input))
          .data;
      } catch (err) {
        throw new Error(
          getApiErrorMessage(err, "Impossible d'envoyer le message."),
        );
      }
    },
  });
}
