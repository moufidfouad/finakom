import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { JobPostingFacets, PaginatedResponse, PublicJobPosting } from "@/types";

export interface PublicJobPostingsFilters {
  page: number;
  search?: string;
  contractType?: string;
  location?: string;
  skill?: string;
  minExperience?: number;
}

export function usePublicJobPostings(filters: PublicJobPostingsFilters) {
  return useQuery({
    queryKey: ["public-job-postings", filters],
    queryFn: async (): Promise<PaginatedResponse<PublicJobPosting>> =>
      (await apiClient.get("/job-postings", { params: filters })).data,
    // Garde les résultats de la page précédente affichés pendant le
    // chargement de la nouvelle plutôt qu'un écran vide — la liste ne
    // "saute" pas visuellement à chaque changement de page ou de filtre.
    placeholderData: keepPreviousData,
  });
}

/** Chargées une seule fois (pas de dépendance aux filtres actifs) — les
 * options de filtre elles-mêmes ne doivent jamais se réduire au fil de la
 * recherche de l'utilisateur, seul le nombre de résultats change. */
export function usePublicJobPostingFacets() {
  return useQuery({
    queryKey: ["public-job-postings-facets"],
    queryFn: async (): Promise<JobPostingFacets> =>
      (await apiClient.get("/job-postings/facets")).data,
    staleTime: 5 * 60_000,
  });
}

export function usePublicJobPosting(jobPostingId: string | undefined) {
  return useQuery({
    queryKey: ["public-job-posting", jobPostingId],
    queryFn: async (): Promise<PublicJobPosting> =>
      (await apiClient.get(`/job-postings/${jobPostingId}`)).data,
    enabled: !!jobPostingId,
  });
}
