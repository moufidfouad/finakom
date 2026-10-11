import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { MapPin, MessageSquare } from "lucide-react";
import { usePublicCompany } from "@/features/publicCompanies/publicCompanies.api";
import { useCompanies } from "@/features/companies/companies.api";
import { apiClient } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingState } from "@/components/ui/loading-state";
import { Conversation } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "@/lib/toast";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function CompanyDirectoryDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { data: company, isLoading } = usePublicCompany(companyId);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  usePageMeta({
    title: company
      ? `${company.name} — Annuaire des entreprises — FINAKOM`
      : "Profil entreprise — FINAKOM",
    description: company
      ? `Profil de ${company.name} sur FINAKOM.`
      : "Profil d'entreprise FINAKOM.",
    path: `/annuaire-entreprises/${companyId}`,
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <LoadingState />
      </div>
    );
  if (!company)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
        Profil introuvable.
      </div>
    );

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <p className="text-xs text-muted-foreground">
        <Link to="/annuaire-entreprises" className="hover:text-foreground">
          ← Toutes les entreprises
        </Link>
      </p>
      <div className="mt-4 flex items-start justify-between gap-4">
        <h1 className="font-display text-2xl font-medium text-foreground sm:text-3xl">
          {company.name}
        </h1>
        {company.sector && <Badge variant="secondary">{company.sector}</Badge>}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{company.country}</p>
      {company.address && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" /> {company.address}
        </p>
      )}

      {company.publicDescription && (
        <Card className="mt-8">
          <CardContent className="whitespace-pre-line p-6 text-sm leading-relaxed text-foreground">
            {company.publicDescription}
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        {isAuthenticated ? (
          <ContactCompanyButton targetCompanyId={company.id} />
        ) : (
          <Link to="/connexion" state={{ redirect: location.pathname }}>
            <Button variant="accent" size="lg">
              Se connecter pour contacter
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}

/**
 * Une entreprise peut appartenir à plusieurs sociétés — impossible de savoir
 * "au nom de laquelle" contacter sans lui demander. Si une seule entreprise,
 * on saute directement à l'action ; sinon un menu déroulant pour choisir,
 * même patron que AuthChoiceButton (dropdown plutôt qu'une redirection
 * qui ferait deviner le bon choix). Appel API direct (pas useStartCompanyConversation,
 * qui fige companyId au moment de l'appel du hook — inutilisable ici où
 * l'entreprise appelante n'est connue qu'au clic).
 */
function ContactCompanyButton({
  targetCompanyId,
}: {
  targetCompanyId: string;
}) {
  const { data: myCompanies } = useCompanies();
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  async function contactFrom(myCompanyId: string) {
    setIsPending(true);
    try {
      const conversation = await apiClient.post<Conversation>(
        `/companies/${myCompanyId}/conversations`,
        { targetCompanyId },
      );
      navigate(
        `/app/entreprises/${myCompanyId}?tab=messages&conversation=${conversation.data.id}`,
      );
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Impossible de démarrer la conversation."),
      );
    } finally {
      setIsPending(false);
    }
  }

  if (!myCompanies || myCompanies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Créez votre entreprise pour pouvoir contacter d'autres entreprises.
      </p>
    );
  }

  if (myCompanies.length === 1) {
    return (
      <Button
        variant="accent"
        size="lg"
        onClick={() => contactFrom(myCompanies[0].id)}
        isLoading={isPending}
      >
        <MessageSquare className="h-4 w-4" /> Contacter cette entreprise
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="accent" size="lg" isLoading={isPending}>
          <MessageSquare className="h-4 w-4" /> Contacter cette entreprise
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Depuis quelle entreprise ?</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {myCompanies.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => contactFrom(c.id)}>
            {c.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
