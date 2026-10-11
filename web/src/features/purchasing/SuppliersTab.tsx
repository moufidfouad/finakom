import { useState } from "react";
import { Plus, Pencil, Trash2, Truck, Download } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Supplier, SupplierInput } from "@/types";
import {
  useCreateSupplier,
  useDeleteSupplier,
  useSuppliers,
  useUpdateSupplier,
} from "./suppliers.api";
import SupplierForm from "./SupplierForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { apiClient } from "@/lib/axios";
import { LoadingState } from "@/components/ui/loading-state";
import { useDataTable } from "@/hooks/useDataTable";
import { SearchBar } from "@/components/ui/search-bar";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { TablePagination } from "@/components/ui/table-pagination";

const qualityVariant: Record<string, "success" | "secondary" | "accent"> = {
  Excellent: "success",
  Bon: "secondary",
  Nouveau: "accent",
};

export default function SuppliersTab({ companyId }: { companyId: string }) {
  const { data: suppliers, isLoading } = useSuppliers(companyId);
  const createSupplier = useCreateSupplier(companyId);
  const updateSupplier = useUpdateSupplier(companyId);
  const deleteSupplier = useDeleteSupplier(companyId);

  const table = useDataTable(suppliers, {
    searchFields: (s) => [s.name, s.code, s.email, s.phone],
    sortAccessors: {
      code: (s) => s.code,
      name: (s) => s.name,
      quality: (s) => s.quality,
    },
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(s: Supplier) {
    setEditing(s);
    setFormOpen(true);
  }

  const editValues: SupplierInput | undefined = editing
    ? {
        name: editing.name,
        type: editing.type,
        address: editing.address ?? "",
        phone: editing.phone ?? "",
        email: editing.email ?? "",
        rccm: editing.rccm ?? "",
        quality: editing.quality,
      }
    : undefined;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {suppliers ? `${suppliers.length} fournisseur(s)` : "Chargement…"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `${apiClient.defaults.baseURL}/companies/${companyId}/suppliers/export.csv`,
                "_blank",
              )
            }
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="accent" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nouveau fournisseur
          </Button>
        </div>
      </div>

      {suppliers && suppliers.length > 0 && (
        <div className="mt-4">
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Rechercher un fournisseur…"
          />
        </div>
      )}

      <div className="mt-4">
        {isLoading && <LoadingState />}

        {suppliers && suppliers.length === 0 && (
          <EmptyState
            icon={Truck}
            message="Aucun fournisseur enregistré pour cette entreprise."
          />
        )}

        {suppliers && suppliers.length > 0 && table.totalCount === 0 && (
          <EmptyState
            icon={Truck}
            message="Aucun fournisseur ne correspond à cette recherche."
          />
        )}

        {suppliers && table.totalCount > 0 && (
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
                    sortKey="name"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Nom / Raison sociale
                  </SortableTableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contact
                  </TableHead>
                  <SortableTableHead
                    sortKey="quality"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Fiabilité
                  </SortableTableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">
                      {s.code}
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {s.type}
                    </TableCell>
                    <TableCell className="hidden max-w-40 truncate md:table-cell text-muted-foreground">
                      {s.phone || s.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={qualityVariant[s.quality] ?? "secondary"}>
                        {s.quality}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(s)}
                        aria-label="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleting(s)}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le fournisseur" : "Nouveau fournisseur"}
            </DialogTitle>
          </DialogHeader>
          <SupplierForm
            initialValues={editValues}
            submitLabel={editing ? "Enregistrer" : "Ajouter le fournisseur"}
            onSubmit={async (values) => {
              if (editing)
                await updateSupplier.mutateAsync({
                  id: editing.id,
                  input: values,
                });
              else await createSupplier.mutateAsync(values);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer ce fournisseur ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deleting?.name}</strong>. Impossible si des documents
            d'achat y sont associés.
          </>
        }
        confirmLabel="Confirmer la suppression"
        isLoading={deleteSupplier.isPending}
        onConfirm={async () => {
          if (deleting) {
            await deleteSupplier.mutateAsync(deleting.id);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
