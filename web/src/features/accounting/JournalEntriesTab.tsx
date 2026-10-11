import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { JournalEntry } from "@/types";
import { useChartOfAccounts } from "./chartOfAccounts.api";
import {
  useCreateManualEntry,
  useDeleteJournalEntry,
  useJournalEntries,
} from "./journalEntries.api";
import JournalEntryForm from "./JournalEntryForm";
import { JOURNAL_TYPES } from "./accounting.constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { useDataTable } from "@/hooks/useDataTable";
import { SearchBar } from "@/components/ui/search-bar";
import { TablePagination } from "@/components/ui/table-pagination";

export default function JournalEntriesTab({
  companyId,
}: {
  companyId: string;
}) {
  const formatAmount = useFormatAmount();
  const [journalFilter, setJournalFilter] = useState<string | undefined>(
    undefined,
  );
  const { data: entries, isLoading } = useJournalEntries(
    companyId,
    journalFilter,
  );
  const { data: accounts } = useChartOfAccounts(companyId);
  const createEntry = useCreateManualEntry(companyId);
  const deleteEntry = useDeleteJournalEntry(companyId);
  const [formOpen, setFormOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Pas un vrai <Table> (liste de cartes accordéon) — recherche et
  // pagination seulement, pas de tri par en-tête de colonne (il n'y en a pas).
  const table = useDataTable(entries, {
    searchFields: (e) => [e.label, e.pieceNumber, e.journal],
  });

  const accountOptions = (accounts ?? []).map((a) => ({
    value: a.accountNumber,
    label: `${a.accountNumber} — ${a.label}`,
  }));

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 overflow-x-auto rounded-lg bg-secondary/60 p-1">
          <button
            type="button"
            onClick={() => setJournalFilter(undefined)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              !journalFilter
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Tous
          </button>
          {JOURNAL_TYPES.map((j) => (
            <button
              key={j.value}
              type="button"
              onClick={() => setJournalFilter(j.value)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                journalFilter === j.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {j.label}
            </button>
          ))}
        </div>
        <Button variant="accent" size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Nouvelle écriture
        </Button>
      </div>

      {entries && entries.length > 0 && (
        <div className="mt-4">
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Rechercher une écriture…"
          />
        </div>
      )}

      <div className="mt-4">
        {isLoading && <LoadingState />}
        {entries && entries.length === 0 && (
          <EmptyState
            icon={BookOpen}
            message="Aucune écriture pour le moment."
          />
        )}
        {entries && entries.length > 0 && table.totalCount === 0 && (
          <EmptyState
            icon={BookOpen}
            message="Aucune écriture ne correspond à cette recherche."
          />
        )}
        {entries && table.totalCount > 0 && (
          <div className="flex flex-col gap-3">
            {table.data.map((entry: JournalEntry) => {
              const totalDebit = entry.lines.reduce(
                (s, l) => s + Number(l.debit),
                0,
              );
              return (
                <Card key={entry.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                    onClick={() =>
                      setExpanded(expanded === entry.id ? null : entry.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{entry.journal}</Badge>
                      <div>
                        <p className="text-sm font-medium">{entry.label}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {entry.pieceNumber} — {formatDate(entry.date)}
                          {entry.sourceType && " · généré automatiquement"}
                        </p>
                      </div>
                    </div>
                    <span className="tabular text-sm font-medium">
                      {formatAmount(totalDebit)}
                    </span>
                  </button>
                  {expanded === entry.id && (
                    <CardContent className="border-t border-border pt-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Compte</TableHead>
                            <TableHead>Libellé</TableHead>
                            <TableHead className="text-right">Débit</TableHead>
                            <TableHead className="text-right">Crédit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entry.lines.map((l) => (
                            <TableRow key={l.id}>
                              <TableCell className="font-mono text-xs">
                                {l.chartOfAccount.accountNumber} —{" "}
                                {l.chartOfAccount.label}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {l.label ?? "—"}
                              </TableCell>
                              <TableCell className="tabular text-right">
                                {Number(l.debit) > 0
                                  ? formatAmount(Number(l.debit))
                                  : ""}
                              </TableCell>
                              <TableCell className="tabular text-right">
                                {Number(l.credit) > 0
                                  ? formatAmount(Number(l.credit))
                                  : ""}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {!entry.sourceType && (
                        <div className="mt-3 flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteEntry.mutate(entry.id)}
                          >
                            Supprimer cette écriture
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        {entries && table.totalCount > 0 && (
          <TablePagination
            page={table.page}
            totalPages={table.totalPages}
            totalCount={table.totalCount}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
          />
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle écriture manuelle</DialogTitle>
          </DialogHeader>
          <JournalEntryForm
            accountOptions={accountOptions}
            onSubmit={async (v) => {
              await createEntry.mutateAsync(v);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
