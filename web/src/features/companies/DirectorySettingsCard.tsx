import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useCompany, useUpdateDirectorySettings } from './companies.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/ui/loading-state';

/**
 * Publication au répertoire public d'entreprises — décision qui engage
 * l'image publique de toute l'entreprise, cohérent avec la protection
 * backend (propriétaire/admin uniquement, pas tout membre). Contrairement à
 * la visibilité d'un CV candidat, un profil publié ici n'est jamais exclu
 * de l'indexation par les moteurs de recherche : c'est voulu, un profil
 * entreprise a une valeur marketing à être trouvé.
 */
export default function DirectorySettingsCard({ companyId }: { companyId: string }) {
  const { data: company, isLoading, isError } = useCompany(companyId);
  const updateSettings = useUpdateDirectorySettings(companyId);
  const [description, setDescription] = useState<string | null>(null);

  if (isLoading) return <LoadingState variant="card" />;

  // Distingue explicitement l'échec du chargement en cours — sans ça, une
  // erreur réseau ou un backend pas encore à jour (nouveaux champs absents
  // de la base) laissait ce composant bloqué indéfiniment sur l'état de
  // chargement, sans aucun indice pour diagnostiquer le problème.
  if (isError || !company) {
    return (
      <Card className="mt-6">
        <CardContent className="p-4 text-sm text-destructive">
          Impossible de charger les réglages de l'annuaire — le backend est peut-être encore en
          cours de mise à jour (nouveaux champs `directoryVisibility`/`publicDescription`).
        </CardContent>
      </Card>
    );
  }

  const currentDescription = description ?? company.publicDescription ?? '';
  const isPublic = company.directoryVisibility === 'Public';

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4" /> Annuaire public des entreprises</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-md border border-border p-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">Ce profil est</p>
              <Badge variant={isPublic ? 'success' : 'secondary'}>{company.directoryVisibility}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Visible dans l'annuaire, contactable par d'autres entreprises — y compris par les moteurs de recherche.
            </p>
          </div>
          <Button
            variant="outline" size="sm"
            isLoading={updateSettings.isPending}
            onClick={() => updateSettings.mutate({ directoryVisibility: isPublic ? 'Brouillon' : 'Public', publicDescription: currentDescription })}
          >
            {isPublic ? 'Dépublier' : 'Publier'}
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="public-description">Présentation publique (optionnel)</Label>
          <Textarea
            id="public-description"
            rows={4}
            value={currentDescription}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Quelques lignes sur votre activité, pour les entreprises et candidats qui consultent votre profil…"
          />
        </div>

        <Button
          variant="outline" size="sm" className="self-start"
          isLoading={updateSettings.isPending}
          onClick={() => updateSettings.mutate({ directoryVisibility: company.directoryVisibility, publicDescription: currentDescription })}
        >
          Enregistrer la présentation
        </Button>
      </CardContent>
    </Card>
  );
}
