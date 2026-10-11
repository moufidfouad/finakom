import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, MapPin } from "lucide-react";
import {
  usePublicCompanies,
  usePublicCompanyFacets,
} from "@/features/publicCompanies/publicCompanies.api";
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

export default function CompanyDirectoryPage() {
  usePageMeta({
    title: "Annuaire des entreprises — FINAKOM",
    description:
      "Découvrez les entreprises de l'espace OHADA présentes sur FINAKOM et entrez en contact.",
    path: "/annuaire-entreprises",
    // Pas de noindex ici, à la différence de l'annuaire de CV : un profil
    // entreprise publié a une valeur marketing à être indexé, contrairement
    // aux données personnelles d'un candidat.
  });

  const [search, setSearch] = useState("");
  const [sector, setSector] = useState(ALL_VALUE);
  const [country, setCountry] = useState(ALL_VALUE);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data: facets } = usePublicCompanyFacets();
  const { data, isLoading } = usePublicCompanies({
    page,
    search: debouncedSearch || undefined,
    sector: sector === ALL_VALUE ? undefined : sector,
    country: country === ALL_VALUE ? undefined : country,
  });

  function resetToFirstPage() {
    setPage(1);
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <Badge variant="outline" className="mb-4">
        Annuaire des entreprises
      </Badge>
      <h1 className="font-display text-3xl font-medium leading-tight text-foreground sm:text-4xl">
        Le réseau des entreprises de l'espace OHADA
      </h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
        Des entreprises qui ont choisi de se faire connaître sur FINAKOM —
        consultez leur profil et entrez en contact.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetToFirstPage();
          }}
          placeholder="Rechercher une entreprise…"
        />
        <Select
          value={sector}
          onValueChange={(v) => {
            setSector(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Secteur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tous les secteurs</SelectItem>
            {facets?.sectors.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={country}
          onValueChange={(v) => {
            setCountry(v);
            resetToFirstPage();
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Pays" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tous les pays</SelectItem>
            {facets?.countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8">
        {isLoading && <LoadingState />}

        {data && data.items.length === 0 && (
          <EmptyState
            icon={Building2}
            message="Aucune entreprise ne correspond à ces critères."
          />
        )}

        {data && data.items.length > 0 && (
          <>
            <div className="flex flex-col gap-4">
              {data.items.map((company) => (
                <Link
                  key={company.id}
                  to={`/annuaire-entreprises/${company.id}`}
                >
                  <Card className="transition-shadow hover:shadow-lg hover:shadow-primary/5">
                    <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                      <CardTitle className="text-base">
                        {company.name}
                      </CardTitle>
                      {company.sector && (
                        <Badge variant="secondary">{company.sector}</Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {company.country}
                      </p>
                      {company.address && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {company.address}
                        </p>
                      )}
                      {company.publicDescription && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {company.publicDescription}
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
