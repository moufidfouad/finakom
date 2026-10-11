import { useState } from "react";
import {
  AlertTriangle,
  ArchiveRestore,
  Building2,
  Calculator,
  Package,
  Plus,
  Trash2,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatCard } from "@/components/ui/stat-card";
import { FixedAsset, FixedAssetInput } from "@/types";
import {
  useCreateFixedAsset,
  useDeleteFixedAsset,
  useFixedAssets,
  useUpdateFixedAsset,
} from "./assets.api";
import {
  useFixedAssetDashboard,
  usePostAnnualDepreciation,
} from "./dashboard.api";
import { useCreateAssetMovement } from "./movements.api";
import AssetForm from "./AssetForm";
import MovementForm from "./MovementForm";
import { useCompanyPermissions } from "@/features/companies/useCompanyPermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { LoadingState } from "@/components/ui/loading-state";
import { useDataTable } from "@/hooks/useDataTable";
import { SearchBar } from "@/components/ui/search-bar";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { TablePagination } from "@/components/ui/table-pagination";

const statusVariant: Record<
  string,
  "success" | "accent" | "destructive" | "secondary"
> = {
  Actif: "success",
  Amorti: "destructive",
  "Non amortissable": "secondary",
};

export default function AssetsTab({ companyId }: { companyId: string }) {
  const formatAmount = useFormatAmount();
  const { data: assets, isLoading } = useFixedAssets(companyId);
  const { data: dashboard } = useFixedAssetDashboard(companyId);
  const createAsset = useCreateFixedAsset(companyId);
  const updateAsset = useUpdateFixedAsset(companyId);
  const deleteAsset = useDeleteFixedAsset(companyId);
  const postDepreciation = usePostAnnualDepreciation(companyId);
  const { canModify } = useCompanyPermissions(companyId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FixedAsset | null>(null);
  const [deleting, setDeleting] = useState<FixedAsset | null>(null);
  const [movementFor, setMovementFor] = useState<FixedAsset | null>(null);
  const createMovement = useCreateAssetMovement(
    movementFor?.id ?? "",
    companyId,
  );

  const table = useDataTable(assets, {
    searchFields: (a) => [a.designation, a.code, a.category],
    sortAccessors: {
      code: (a) => a.code,
      designation: (a) => a.designation,
      grossValue: (a) => Number(a.grossValue),
      netBookValue: (a) => a.depreciation.netBookValue,
    },
  });

  const editValues: FixedAssetInput | undefined = editing
    ? {
        accountNumber: editing.accountNumber,
        acquisitionDate: editing.acquisitionDate.slice(0, 10),
        designation: editing.designation,
        category: editing.category,
        location: editing.location ?? "",
        method: editing.method,
        durationYears: editing.durationYears ?? undefined,
        grossValue: Number(editing.grossValue),
        notes: editing.notes ?? "",
      }
    : undefined;

  return (
    <div>
      {dashboard && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <StatCard
                icon={Building2}
                label="Valeur brute"
                value={formatAmount(dashboard.patrimoine.grossValueTotal)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <StatCard
                icon={TrendingDown}
                label="Amort. cumulés"
                value={formatAmount(
                  dashboard.patrimoine.accumulatedDepreciationTotal,
                )}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <StatCard
                icon={Wallet}
                label="VNC totale"
                value={formatAmount(dashboard.patrimoine.netBookValueTotal)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <StatCard
                icon={Calculator}
                label="Dotation exercice"
                value={formatAmount(dashboard.patrimoine.annualDotationTotal)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {dashboard &&
        (dashboard.alerts.over80PercentDepreciated > 0 ||
          dashboard.alerts.noDepreciationRecorded > 0) && (
          <div className="mb-6 flex items-start gap-2 rounded-md border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p>
              {dashboard.alerts.over80PercentDepreciated} bien(s) amorti(s) à
              plus de 80% · {dashboard.alerts.noDepreciationRecorded} bien(s)
              sans amortissement enregistré.
            </p>
          </div>
        )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {assets ? `${assets.length} immobilisation(s)` : "Chargement…"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            isLoading={postDepreciation.isPending}
            onClick={() => postDepreciation.mutate()}
          >
            <Calculator className="h-4 w-4" /> Comptabiliser les dotations
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nouvelle immobilisation
          </Button>
        </div>
      </div>

      {assets && assets.length > 0 && (
        <div className="mt-4">
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Rechercher une immobilisation…"
          />
        </div>
      )}

      <div className="mt-4">
        {isLoading && <LoadingState />}

        {assets && assets.length === 0 && (
          <EmptyState
            icon={Package}
            message="Aucune immobilisation enregistrée."
          />
        )}

        {assets && assets.length > 0 && table.totalCount === 0 && (
          <EmptyState
            icon={Package}
            message="Aucune immobilisation ne correspond à cette recherche."
          />
        )}

        {assets && table.totalCount > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortKey="code"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Code
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="designation"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Désignation
                  </SortableTableHead>
                  <TableHead className="hidden sm:table-cell">
                    Catégorie
                  </TableHead>
                  <SortableTableHead
                    sortKey="grossValue"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                    className="text-right"
                  >
                    Valeur brute
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="netBookValue"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                    className="text-right"
                  >
                    VNC
                  </SortableTableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.data.map((a) => {
                  const editable = canModify(a.createdById);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">
                        {a.code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {a.designation}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {a.category}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {formatAmount(Number(a.grossValue))}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {formatAmount(a.depreciation.netBookValue)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[a.depreciation.status]}>
                          {a.depreciation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {editable && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMovementFor(a)}
                              aria-label="Mouvement"
                            >
                              <ArchiveRestore className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditing(a);
                                setFormOpen(true);
                              }}
                              aria-label="Modifier"
                            >
                              <Plus className="h-4 w-4 rotate-45" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleting(a)}
                              aria-label="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? "Modifier l'immobilisation"
                : "Nouvelle immobilisation"}
            </DialogTitle>
          </DialogHeader>
          <AssetForm
            initialValues={editValues}
            submitLabel={editing ? "Enregistrer" : "Ajouter l'immobilisation"}
            onSubmit={async (values) => {
              if (editing)
                await updateAsset.mutateAsync({
                  id: editing.id,
                  input: values,
                });
              else await createAsset.mutateAsync(values);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!movementFor}
        onOpenChange={(o) => !o && setMovementFor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mouvement — {movementFor?.designation}</DialogTitle>
          </DialogHeader>
          {movementFor && (
            <MovementForm
              assetDesignation={movementFor.designation}
              onSubmit={async (values) => {
                await createMovement.mutateAsync(values);
                setMovementFor(null);
              }}
              onCancel={() => setMovementFor(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer cette immobilisation ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deleting?.designation}</strong> et l'historique de ses
            mouvements. Irréversible.
          </>
        }
        confirmLabel="Confirmer la suppression"
        isLoading={deleteAsset.isPending}
        onConfirm={async () => {
          if (deleting) {
            await deleteAsset.mutateAsync(deleting.id);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
