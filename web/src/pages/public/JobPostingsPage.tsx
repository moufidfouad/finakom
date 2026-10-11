import { useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, MapPin } from "lucide-react";
import {
  usePublicJobPostingFacets,
  usePublicJobPostings,
} from "@/features/jobPostings/publicJobPostings.api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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
const EXPERIENCE_THRESHOLDS = [
  { value: "1", label: "1 an et plus" },
  { value: "3", label: "3 ans et plus" },
  { value: "5", label: "5 ans et plus" },
];

export default function JobPostingsPage() {
  usePageMeta({
    title: "Offres d'emploi — FINAKOM",
    description:
      "Consultez les offres d'emploi publiées par les entreprises de l'espace OHADA sur FINAKOM.",
    path: "/offres",
  });

  const [search, setSearch] = useState("");
  const [contractType, setContractType] = useState(ALL_VALUE);
  const [location, setLocation] = useState(ALL_VALUE);
  const [skill, setSkill] = useState(ALL_VALUE);
  const [minExperience, setMinExperience] = useState(ALL_VALUE);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data: facets } = usePublicJobPostingFacets();
  const { data, isLoading } = usePublicJobPostings({
    page,
    search: debouncedSearch || undefined,
    contractType: contractType === ALL_VALUE ? undefined : contractType,
    location: location === ALL_VALUE ? undefined : location,
    skill: skill === ALL_VALUE ? undefined : skill,
    minExperience:
      minExperience === ALL_VALUE ? undefined : Number(minExperience),
  });

  function resetToFirstPage() {
    setPage(1);
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <Badge variant="outline" className="mb-4">
        Offres d'emploi
      </Badge>
      <h1 className="font-display text-3xl font-medium leading-tight text-foreground sm:text-4xl">
        Les entreprises recrutent sur FINAKOM
      </h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
        Consultez les offres publiées par les entreprises de l'espace OHADA et
        postulez directement en ligne.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Vous recrutez ?{" "}
        <Link
          to="/annuaire-cv"
          className="font-medium text-accent hover:underline"
        >
          Consultez l'annuaire des candidats
        </Link>
        .
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetToFirstPage();
          }}
          placeholder="Rechercher un poste…"
        />
        <Select
          value={contractType}
          onValueChange={(v) => {
            setContractType(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Type de contrat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tous les contrats</SelectItem>
            {facets?.contractTypes.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={location}
          onValueChange={(v) => {
            setLocation(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Lieu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tous les lieux</SelectItem>
            {facets?.locations.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={skill}
          onValueChange={(v) => {
            setSkill(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
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
        <Select
          value={minExperience}
          onValueChange={(v) => {
            setMinExperience(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Expérience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tous niveaux</SelectItem>
            {EXPERIENCE_THRESHOLDS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8">
        {isLoading && <LoadingState />}

        {data && data.items.length === 0 && (
          <EmptyState
            icon={Briefcase}
            message="Aucune offre ne correspond à ces critères."
          />
        )}

        {data && data.items.length > 0 && (
          <>
            <div className="flex flex-col gap-4">
              {data.items.map((posting) => (
                <Link key={posting.id} to={`/offres/${posting.id}`}>
                  <Card className="transition-shadow hover:shadow-lg hover:shadow-primary/5">
                    <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                      <div>
                        <CardTitle className="text-base">
                          {posting.title}
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {posting.company.name}
                        </p>
                      </div>
                      <Badge variant="secondary">{posting.contractType}</Badge>
                    </CardHeader>
                    <CardContent>
                      {posting.location && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {posting.location}
                        </p>
                      )}
                      {posting.desiredSkills.length > 0 && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {posting.desiredSkills.map((s) => s.title).join(", ")}
                        </p>
                      )}
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
