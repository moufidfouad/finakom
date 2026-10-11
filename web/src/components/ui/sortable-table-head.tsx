import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { SortDirection } from '@/hooks/useDataTable';
import { cn } from '@/lib/utils';

interface SortableTableHeadProps {
  sortKey: string;
  activeSort: { key: string; direction: SortDirection } | null;
  onSort: (key: string) => void;
  children: React.ReactNode;
  className?: string;
}

/** En-tête de colonne cliquable pour piloter useDataTable — affiche une
 * flèche neutre au repos, puis l'orientation du tri actif une fois cliqué. */
export function SortableTableHead({ sortKey, activeSort, onSort, children, className }: SortableTableHeadProps) {
  const isActive = activeSort?.key === sortKey;
  return (
    <TableHead className={cn('cursor-pointer select-none hover:text-foreground', className)} onClick={() => onSort(sortKey)}>
      <span className="inline-flex items-center gap-1">
        {children}
        {isActive && activeSort!.direction === 'asc' && <ArrowUp className="h-3 w-3" />}
        {isActive && activeSort!.direction === 'desc' && <ArrowDown className="h-3 w-3" />}
        {!isActive && <ArrowUpDown className="h-3 w-3 opacity-30" />}
      </span>
    </TableHead>
  );
}
