import { LucideIcon, AlertTriangle, Clock, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { SearchBar } from "@/components/ui/search-bar";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { TablePagination } from "@/components/ui/table-pagination";
import { useDataTable } from "@/hooks/useDataTable";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { AgingBucket, AgingReport, PartyRiskLevel } from "@/types";

const BUCKET_LABELS: Record<AgingBucket, string> = {
  "0-30": "0 à 30 jours",
  "31-60": "31 à 60 jours",
  "61-90": "61 à 90 jours",
  "90+": "Plus de 90 jours",
};
const BUCKET_BAR_COLOR: Record<AgingBucket, string> = {
  "0-30": "bg-success/70",
  "31-60": "bg-muted-foreground/40",
  "61-90": "bg-accent",
  "90+": "bg-destructive",
};
const RISK_BADGE: Record<
  PartyRiskLevel,
  "secondary" | "accent" | "destructive"
> = { OK: "secondary", ALERTE: "accent", CRITIQUE: "destructive" };

/**
 * Vue de balance âgée générique — réutilisée à l'identique par le
 * recouvrement client (CollectionsTab) et le suivi fournisseur (PayablesTab) :
 * les deux affichent EXACTEMENT la même structure (cartes de stats, barres
 * de répartition par ancienneté, tableau trié par risque), seuls les
 * libellés et l'icône diffèrent. Extrait après coup en découvrant cette
 * réutilisation, cohérent avec le moteur backend partagé (collectionsEngine.ts).
 */
export function AgingReportView({
  report,
  isLoading,
  icon: Icon,
  partyLabel,
  partyLabelPlural,
  totalOutstandingLabel,
  columnLabel,
  emptyMessage,
  searchPlaceholder,
}: {
  report: AgingReport | undefined;
  isLoading: boolean;
  icon: LucideIcon;
  partyLabel: string;
  partyLabelPlural: string;
  totalOutstandingLabel: string;
  columnLabel: string;
  emptyMessage: string;
  searchPlaceholder: string;
}) {
  const formatAmount = useFormatAmount();

  const table = useDataTable(report?.byParty, {
    searchFields: (p) => [p.partyName],
    sortAccessors: {
      party: (p) => p.partyName,
      outstanding: (p) => p.totalOutstanding,
      oldest: (p) => p.oldestInvoiceDays,
      invoices: (p) => p.invoiceCount,
    },
    defaultSort: { key: "oldest", direction: "desc" },
  });

  if (isLoading) return <LoadingState variant="card" />;
  if (!report)
    return (
      <p className="text-sm text-destructive">
        Impossible de charger le rapport.
      </p>
    );

  const maxBucket = Math.max(...Object.values(report.bucketTotals), 1);
  const atRiskCount = report.byParty.filter((p) => p.riskLevel !== "OK").length;
  const oldestOverall = report.byParty[0]?.oldestInvoiceDays ?? 0;

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <StatCard
              icon={Wallet}
              label={totalOutstandingLabel}
              value={formatAmount(report.totalOutstanding)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <StatCard
              icon={Users}
              label={`${partyLabelPlural} à surveiller`}
              value={String(atRiskCount)}
              sub={`sur ${report.byParty.length} ${partyLabelPlural.toLowerCase()} avec impayé`}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <StatCard
              icon={Clock}
              label="Retard le plus ancien"
              value={oldestOverall > 0 ? `${oldestOverall} j` : "—"}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <StatCard
              icon={AlertTriangle}
              label="Factures en 90+ jours"
              value={String(
                report.lines.filter((l) => l.bucket === "90+").length,
              )}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Répartition par ancienneté
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {(Object.keys(BUCKET_LABELS) as AgingBucket[]).map((bucket) => (
            <div key={bucket} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">
                {BUCKET_LABELS[bucket]}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full ${BUCKET_BAR_COLOR[bucket]}`}
                  style={{
                    width: `${(report.bucketTotals[bucket] / maxBucket) * 100}%`,
                  }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-xs tabular-nums text-foreground">
                {formatAmount(report.bucketTotals[bucket])}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {report.byParty.length > 0 && (
        <div className="mb-4">
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder={searchPlaceholder}
          />
        </div>
      )}

      {report.byParty.length === 0 && (
        <EmptyState icon={Icon} message={emptyMessage} />
      )}

      {report.byParty.length > 0 && table.totalCount === 0 && (
        <EmptyState
          icon={Icon}
          message={`Aucun ${partyLabel} ne correspond à cette recherche.`}
        />
      )}

      {report.byParty.length > 0 && table.totalCount > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  sortKey="party"
                  activeSort={table.sort}
                  onSort={table.toggleSort}
                >
                  {columnLabel}
                </SortableTableHead>
                <SortableTableHead
                  sortKey="invoices"
                  activeSort={table.sort}
                  onSort={table.toggleSort}
                  className="text-right"
                >
                  Factures
                </SortableTableHead>
                <SortableTableHead
                  sortKey="outstanding"
                  activeSort={table.sort}
                  onSort={table.toggleSort}
                  className="text-right"
                >
                  Encours
                </SortableTableHead>
                <SortableTableHead
                  sortKey="oldest"
                  activeSort={table.sort}
                  onSort={table.toggleSort}
                  className="text-right"
                >
                  Retard max.
                </SortableTableHead>
                <TableHead>Risque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.data.map((p) => (
                <TableRow key={p.partyId}>
                  <TableCell className="font-medium">{p.partyName}</TableCell>
                  <TableCell className="tabular text-right">
                    {p.invoiceCount}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatAmount(p.totalOutstanding)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {p.oldestInvoiceDays} j
                  </TableCell>
                  <TableCell>
                    <Badge variant={RISK_BADGE[p.riskLevel]}>
                      {p.riskLevel}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            page={table.page}
            totalPages={table.totalPages}
            totalCount={table.totalCount}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
          />
        </Card>
      )}
    </div>
  );
}
