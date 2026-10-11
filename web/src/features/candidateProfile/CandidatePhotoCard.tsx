import { useRef, useState } from "react";
import { UserRound, Trash2, Upload } from "lucide-react";
import {
  useUploadCandidatePhoto,
  useDeleteCandidatePhoto,
} from "./candidatePhoto.api";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUploadUrl } from "@/lib/axios";
import { toast } from "@/lib/toast";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 Mo — doit rester cohérent avec la limite backend (multer)
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * Photo du candidat — partagée entre tous ses CV (voir Candidate.photoUrl),
 * utilisée sur le gabarit PDF "moderne" et sur le profil public si showPhoto
 * est activé pour le CV concerné (réglage par CV, pas ici).
 */
export default function CandidatePhotoCard() {
  const { candidate, refreshProfile } = useCandidateAuth();
  const uploadPhoto = useUploadCandidatePhoto(refreshProfile);
  const deletePhoto = useDeleteCandidatePhoto(refreshProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewError, setPreviewError] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de resélectionner le même fichier après une erreur
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Format non supporté — utilisez PNG, JPEG ou WebP.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Image trop volumineuse (2 Mo maximum).");
      return;
    }
    setPreviewError(false);
    uploadPhoto.mutate(file);
  }

  const photoSrc = candidate?.photoUrl
    ? getUploadUrl(candidate.photoUrl)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Photo</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Affichée sur le gabarit de CV « moderne » et sur votre profil public
          si vous choisissez de l'y afficher (réglage disponible pour chaque
          CV).
        </p>

        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-secondary/40">
            {photoSrc && !previewError ? (
              <img
                src={photoSrc}
                alt="Votre photo"
                className="h-full w-full object-cover"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <UserRound className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              size="sm"
              variant="outline"
              isLoading={uploadPhoto.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />{" "}
              {candidate?.photoUrl ? "Remplacer la photo" : "Envoyer une photo"}
            </Button>
            {candidate?.photoUrl && (
              <Button
                size="sm"
                variant="ghost"
                isLoading={deletePhoto.isPending}
                onClick={() => deletePhoto.mutate()}
              >
                <Trash2 className="h-4 w-4 text-destructive" /> Retirer la photo
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              PNG, JPEG ou WebP — 2 Mo maximum.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
