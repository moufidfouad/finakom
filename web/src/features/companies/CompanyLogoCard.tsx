import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import {
  useCompany,
  useDeleteCompanyLogo,
  useUploadCompanyLogo,
} from "./companies.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUploadUrl } from "@/lib/axios";
import { toast } from "@/lib/toast";

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 Mo — doit rester cohérent avec la limite backend (multer)
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * Logo de l'entreprise — intégré automatiquement dans tous les documents PDF
 * générés (factures, bulletins de paie, contrats, business plan, états
 * financiers), sans action supplémentaire une fois envoyé ici.
 */
export default function CompanyLogoCard({ companyId }: { companyId: string }) {
  const { data: company } = useCompany(companyId);
  const uploadLogo = useUploadCompanyLogo(companyId);
  const deleteLogo = useDeleteCompanyLogo(companyId);
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
    uploadLogo.mutate(file);
  }

  const logoSrc = company?.logoUrl ? getUploadUrl(company.logoUrl) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Logo de l'entreprise</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Intégré automatiquement dans les devis, factures, bons de livraison,
          bulletins de paie, contrats de travail, business plans et états
          financiers exportés en PDF.
        </p>

        <div className="flex items-center gap-4">
          <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-secondary/40">
            {logoSrc && !previewError ? (
              <img
                src={logoSrc}
                alt="Logo de l'entreprise"
                className="h-full w-full object-contain"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
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
              isLoading={uploadLogo.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />{" "}
              {company?.logoUrl ? "Remplacer le logo" : "Envoyer un logo"}
            </Button>
            {company?.logoUrl && (
              <Button
                size="sm"
                variant="ghost"
                isLoading={deleteLogo.isPending}
                onClick={() => deleteLogo.mutate()}
              >
                <Trash2 className="h-4 w-4 text-destructive" /> Retirer le logo
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
