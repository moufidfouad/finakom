import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { candidateApiClient } from '@/lib/candidateAxios';
import { Cv, CvInput, CvTemplate, CvVisibility } from '@/types';

const CVS_KEY = ['candidate-cvs'];

/** Lien direct, pas un hook — le cookie httpOnly de session candidate est
 * envoyé automatiquement par le navigateur pour une navigation GET normale
 * (contrairement à un appel XHR/fetch, aucun withCredentials nécessaire ici). */
export function getCvPdfUrl(cvId: string): string {
  return `${candidateApiClient.defaults.baseURL}/candidate/cvs/${cvId}/pdf`;
}

export function useCvs() {
  return useQuery({
    queryKey: CVS_KEY,
    queryFn: async (): Promise<Cv[]> => (await candidateApiClient.get('/candidate/cvs')).data,
  });
}

export function useCv(cvId: string | undefined) {
  return useQuery({
    queryKey: ['candidate-cv', cvId],
    queryFn: async (): Promise<Cv> => (await candidateApiClient.get(`/candidate/cvs/${cvId}`)).data,
    enabled: !!cvId,
  });
}

export function useCreateCv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CvInput): Promise<Cv> => (await candidateApiClient.post('/candidate/cvs', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CVS_KEY }),
  });
}

export function useUpdateCv(cvId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CvInput): Promise<Cv> => (await candidateApiClient.put(`/candidate/cvs/${cvId}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CVS_KEY }),
  });
}

export interface UpdateCvVisibilityInput {
  cvId: string;
  visibility: CvVisibility;
  template?: CvTemplate;
  showFullName?: boolean;
  showPhoto?: boolean;
  showPhone?: boolean;
}

export function useUpdateCvVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cvId, ...input }: UpdateCvVisibilityInput): Promise<Cv> =>
      (await candidateApiClient.patch(`/candidate/cvs/${cvId}/visibility`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CVS_KEY }),
  });
}

export function useDeleteCv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cvId: string) => candidateApiClient.delete(`/candidate/cvs/${cvId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CVS_KEY }),
  });
}
