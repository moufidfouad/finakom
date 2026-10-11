import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { CompanyFacets, PaginatedResponse, PublicCompany } from "@/types";

export interface PublicCompaniesFilters {
  page: number;
  search?: string;
  sector?: string;
  country?: string;
}

export function usePublicCompanies(filters: PublicCompaniesFilters) {
  return useQuery({
    queryKey: ["public-companies", filters],
    queryFn: async (): Promise<PaginatedResponse<PublicCompany>> =>
      (await apiClient.get("/companies-directory", { params: filters })).data,
    placeholderData: keepPreviousData,
  });
}

export function usePublicCompanyFacets() {
  return useQuery({
    queryKey: ["public-companies-facets"],
    queryFn: async (): Promise<CompanyFacets> =>
      (await apiClient.get("/companies-directory/facets")).data,
    staleTime: 5 * 60_000,
  });
}

export function usePublicCompany(companyId: string | undefined) {
  return useQuery({
    queryKey: ["public-company", companyId],
    queryFn: async (): Promise<PublicCompany> =>
      (await apiClient.get(`/companies-directory/${companyId}`)).data,
    enabled: !!companyId,
  });
}
