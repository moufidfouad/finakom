import { useMutation } from "@tanstack/react-query";
import { candidateApiClient } from "@/lib/candidateAxios";
import { toast } from "@/lib/toast";
import { getApiErrorMessage } from "@/lib/apiError";

/**
 * Contrairement au logo entreprise (invalidation d'une query React Query),
 * le candidat courant vit dans CandidateAuthContext (state React simple,
 * pas React Query) — on recharge via refreshProfile après succès, fourni
 * par l'appelant plutôt qu'importé ici pour ne pas coupler ce module au
 * contexte d'auth.
 */
export function useUploadCandidatePhoto(onSuccess: () => void) {
  return useMutation({
    mutationFn: async (file: File): Promise<void> => {
      const formData = new FormData();
      formData.append("photo", file);
      await candidateApiClient.post("/candidate/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      onSuccess();
      toast.success("Photo mise à jour.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible d'envoyer la photo.")),
  });
}

export function useDeleteCandidatePhoto(onSuccess: () => void) {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await candidateApiClient.delete("/candidate/photo");
    },
    onSuccess: () => {
      onSuccess();
      toast.success("Photo retirée.");
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Impossible de retirer la photo.")),
  });
}
