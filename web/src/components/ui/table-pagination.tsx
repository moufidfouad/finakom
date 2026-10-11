import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/** Pied de tableau standard — "X à Y sur Z résultats" + navigation
 * précédent/suivant. Se masque de lui-même si tout tient sur une page, pour
 * ne pas encombrer les petites listes (le cas normal pour une PME débutante). */
export function TablePagination({ page, totalPages, totalCount, pageSize, onPageChange }: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between border-t border-border px-3 py-2.5 text-sm text-muted-foreground">
      <span>{from}–{to} sur {totalCount} résultat(s)</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Page précédente">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="tabular px-2 text-xs">{page} / {totalPages}</span>
        <Button variant="ghost" size="icon" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Page suivante">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
