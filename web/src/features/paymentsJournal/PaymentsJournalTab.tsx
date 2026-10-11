import { Link } from 'react-router-dom';
import { ArrowDownCircle, ArrowUpCircle, Receipt } from 'lucide-react';
import { usePaymentsJournal } from './paymentsJournal.api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { SearchBar } from '@/components/ui/search-bar';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { TablePagination } from '@/components/ui/table-pagination';
import { useDataTable } from '@/hooks/useDataTable';
import { useFormatAmount } from '@/hooks/useFormatAmount';
import { formatDate } from '@/lib/format';

export default function PaymentsJournalTab({ companyId }: { companyId: string }) {
  const formatAmount = useFormatAmount();
  const { data: entries, isLoading } = usePaymentsJournal(companyId);

  const table = useDataTable(entries, {
    searchFields: (e) => [e.partyName, e.documentNumber, e.method],
    sortAccessors: {
      date: (e) => e.date, party: (e) => e.partyName, amount: (e) => e.amount,
    },
    defaultSort: { key: 'date', direction: 'desc' },
  });

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Tous les règlements enregistrés — encaissements clients et décaissements fournisseurs, réunis dans un seul journal chronologique.
      </p>

      {entries && entries.length > 0 && (
        <div className="mb-4">
          <SearchBar value={table.search} onChange={table.setSearch} placeholder="Rechercher un tiers, un numéro, un mode…" />
        </div>
      )}

      {entries && entries.length === 0 && (
        <EmptyState icon={Receipt} message="Aucun règlement enregistré pour le moment." />
      )}

      {entries && entries.length > 0 && table.totalCount === 0 && (
        <EmptyState icon={Receipt} message="Aucun règlement ne correspond à cette recherche." />
      )}

      {entries && table.totalCount > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="date" activeSort={table.sort} onSort={table.toggleSort}>Date</SortableTableHead>
                <TableHead>Sens</TableHead>
                <SortableTableHead sortKey="party" activeSort={table.sort} onSort={table.toggleSort}>Tiers</SortableTableHead>
                <TableHead>Document</TableHead>
                <SortableTableHead sortKey="amount" activeSort={table.sort} onSort={table.toggleSort} className="text-right">Montant</SortableTableHead>
                <TableHead>Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.data.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                  <TableCell>
                    {e.direction === 'Encaissement' ? (
                      <Badge variant="success" className="gap-1"><ArrowDownCircle className="h-3 w-3" /> Encaissement</Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1"><ArrowUpCircle className="h-3 w-3" /> Décaissement</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{e.partyName}</TableCell>
                  <TableCell>
                    <Link
                      to={e.documentType === 'SalesDocument' ? `/app/documents/${e.documentId}` : `/app/purchase-documents/${e.documentId}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {e.documentNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular text-right">{formatAmount(e.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{e.method ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination page={table.page} totalPages={table.totalPages} totalCount={table.totalCount} pageSize={table.pageSize} onPageChange={table.setPage} />
        </Card>
      )}
    </div>
  );
}
