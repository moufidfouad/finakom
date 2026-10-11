import { useState } from "react";
import { Link } from "react-router-dom";
import { UserRound, Users } from "lucide-react";
import {
  usePublicCvFacets,
  usePublicCvs,
} from "@/features/publicCandidates/publicCandidates.api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getUploadUrl } from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/search-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { usePageMeta } from "@/hooks/usePageMeta";

const ALL_VALUE = "__all__"; // Radix Select interdit une valeur vide sur SelectItem

export default function CvDirectoryPage() {
  usePageMeta({
    title: "Annuaire des candidats — FINAKOM",
    description: "Découvrez les profils publiés par les candidats sur FINAKOM.",
    path: "/annuaire-cv",
    noindex: true, // données personnelles de candidats — jamais indexées par un moteur de recherche
  });

  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState(ALL_VALUE);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data: facets } = usePublicCvFacets();
  const { data, isLoading } = usePublicCvs({
    page,
    search: debouncedSearch || undefined,
    skill: skill === ALL_VALUE ? undefined : skill,
  });

  function resetToFirstPage() {
    setPage(1);
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <Badge variant="outline" className="mb-4">
        Annuaire des candidats
      </Badge>
      <h1 className="font-display text-3xl font-medium leading-tight text-foreground sm:text-4xl">
        Des candidats prêts à rejoindre votre équipe
      </h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
        Des profils publiés librement par des candidats de l'espace OHADA —
        contactez-les directement.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Vous êtes une entreprise ?{" "}
        <Link
          to="/annuaire-entreprises"
          className="font-medium text-accent hover:underline"
        >
          Consultez l'annuaire des entreprises
        </Link>
        .
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetToFirstPage();
          }}
          placeholder="Rechercher un profil…"
        />
        <Select
          value={skill}
          onValueChange={(v) => {
            setSkill(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Compétence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Toutes les compétences</SelectItem>
            {facets?.skills.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8">
        {isLoading && <LoadingState />}

        {data && data.items.length === 0 && (
          <EmptyState
            icon={Users}
            message="Aucun profil ne correspond à ces critères."
          />
        )}

        {data && data.items.length > 0 && (
          <>
            <div className="flex flex-col gap-4">
              {data.items.map((cv) => (
                <Link key={cv.id} to={`/annuaire-cv/${cv.id}`}>
                  <Card className="transition-shadow hover:shadow-lg hover:shadow-primary/5">
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                      {cv.candidate.photoUrl ? (
                        <img
                          src={getUploadUrl(cv.candidate.photoUrl)}
                          alt={cv.candidate.fullName}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/60">
                          <UserRound className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{cv.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {cv.candidate.fullName}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {cv.skills.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {cv.skills.map((s) => s.title).join(", ")}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {cv.experiences.length} expérience(s) ·{" "}
                        {cv.educations.length} formation(s)
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <Card className="mt-4">
              <TablePagination
                page={data.page}
                totalPages={data.totalPages}
                totalCount={data.total}
                pageSize={data.pageSize}
                onPageChange={setPage}
              />
            </Card>
          </>
        )}
      </div>
    </section>
  );
}
