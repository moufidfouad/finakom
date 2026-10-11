import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

interface UseDataTableOptions<T> {
  /** Extrait les champs texte sur lesquels la recherche doit porter — ex:
   * (client) => [client.name, client.code, client.email ?? '']. */
  searchFields?: (item: T) => (string | null | undefined)[];
  /** Un accesseur par clé de tri triable — ex: { name: (c) => c.name, date: (c) => c.date }.
   * Seules les colonnes présentes ici sont triables. */
  sortAccessors?: Record<string, (item: T) => string | number>;
  defaultSort?: { key: string; direction: SortDirection };
  pageSize?: number;
}

/**
 * Recherche + tri + pagination côté client, génériques — pour ne jamais
 * avoir à réécrire cette logique dans chacun des tableaux de l'application.
 * Ne prend volontairement PAS en charge le rendu des lignes : chaque
 * consommateur garde entièrement le contrôle de son propre JSX de cellule
 * (badges, liens, actions...), seul l'ENSEMBLE de données à afficher change
 * (recherché, trié, paginé) — ce qui permet de retrofiter cette capacité sur
 * un tableau existant sans en réécrire le rendu.
 */
export function useDataTable<T>(
  data: T[] | undefined,
  options: UseDataTableOptions<T> = {},
) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{
    key: string;
    direction: SortDirection;
  } | null>(options.defaultSort ?? null);
  const [page, setPage] = useState(1);
  const pageSize = options.pageSize ?? 15;

  const filtered = useMemo(() => {
    const source = data ?? [];
    if (!search.trim() || !options.searchFields) return source;
    const query = search.trim().toLowerCase();
    return source.filter((item) =>
      options.searchFields!(item).some((field) =>
        (field ?? "").toLowerCase().includes(query),
      ),
    );
  }, [data, search, options.searchFields]);

  const sorted = useMemo(() => {
    if (!sort || !options.sortAccessors?.[sort.key]) return filtered;
    const accessor = options.sortAccessors[sort.key];
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sort.direction === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sort, options.sortAccessors]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  // Reprojette la page courante si elle dépasse le nombre de pages disponibles
  // (ex: une recherche réduit le résultat pendant qu'on est en page 3) — sans
  // ce garde-fou, l'utilisateur se retrouverait sur une page vide.
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  function toggleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" };
      return current.direction === "asc" ? { key, direction: "desc" } : null;
    });
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1); // toute nouvelle recherche repart de la première page
  }

  return {
    data: paginated,
    totalCount: sorted.length,
    search,
    setSearch: updateSearch,
    sort,
    toggleSort,
    page: safePage,
    setPage,
    totalPages,
    pageSize,
  };
}
