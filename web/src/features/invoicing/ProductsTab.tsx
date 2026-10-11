import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  Download,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Product, ProductInput } from "@/types";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "./products.api";
import ProductForm from "./ProductForm";
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
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { apiClient } from "@/lib/axios";
import { LoadingState } from "@/components/ui/loading-state";
import { useDataTable } from "@/hooks/useDataTable";
import { SearchBar } from "@/components/ui/search-bar";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { TablePagination } from "@/components/ui/table-pagination";

const alertVariant: Record<number, "destructive" | "accent" | "success"> = {
  0: "destructive",
  1: "accent",
  2: "success",
};

export default function ProductsTab({ companyId }: { companyId: string }) {
  const formatAmount = useFormatAmount();
  const { data: products, isLoading } = useProducts(companyId);
  const createProduct = useCreateProduct(companyId);
  const updateProduct = useUpdateProduct(companyId);
  const deleteProduct = useDeleteProduct(companyId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setFormOpen(true);
  }

  const editValues: ProductInput | undefined = editing
    ? {
        designation: editing.designation,
        unit: editing.unit,
        category: editing.category,
        sellingPriceHT: Number(editing.sellingPriceHT),
        unitCost: editing.unitCost ? Number(editing.unitCost) : 0,
        trackInventory: editing.trackInventory,
        stockMin: Number(editing.stockMin),
        stockInitial: Number(editing.stockInitial),
      }
    : undefined;

  const alerts = (products ?? []).filter(
    (p) => p.stock && p.stock.alertLevel <= 1,
  );

  const table = useDataTable(products, {
    searchFields: (p) => [p.designation, p.code, p.category],
    sortAccessors: {
      code: (p) => p.code,
      designation: (p) => p.designation,
      price: (p) => Number(p.sellingPriceHT),
      stock: (p) => p.stock?.stockFinal ?? -1,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products
            ? `${products.length} article(s) au catalogue`
            : "Chargement…"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `${apiClient.defaults.baseURL}/companies/${companyId}/products/export.csv`,
                "_blank",
              )
            }
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="accent" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nouvel article
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p>
            {alerts.length} article(s) en rupture ou sous le seuil minimum de
            stock.
          </p>
        </div>
      )}

      {products && products.length > 0 && (
        <div className="mt-4">
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Rechercher un article…"
          />
        </div>
      )}

      <div className="mt-4">
        {isLoading && <LoadingState />}

        {products && products.length === 0 && (
          <EmptyState
            icon={Package}
            message="Aucun article au catalogue pour cette entreprise."
          />
        )}

        {products && products.length > 0 && table.totalCount === 0 && (
          <EmptyState
            icon={Package}
            message="Aucun article ne correspond à cette recherche."
          />
        )}

        {products && table.totalCount > 0 && (
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
                    sortKey="price"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                    className="text-right"
                  >
                    Prix HT
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="stock"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                    className="hidden md:table-cell"
                  >
                    Stock
                  </SortableTableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">
                      {p.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.designation}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {p.category}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatAmount(Number(p.sellingPriceHT))}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {p.stock ? (
                        <Badge variant={alertVariant[p.stock.alertLevel]}>
                          {p.stock.stockFinal} — {p.stock.alertLabel}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Non suivi
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p)}
                        aria-label="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleting(p)}
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
        <DialogContent >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier l'article" : "Nouvel article"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            initialValues={editValues}
            submitLabel={editing ? "Enregistrer" : "Ajouter l'article"}
            onSubmit={async (values) => {
              if (editing)
                await updateProduct.mutateAsync({
                  id: editing.id,
                  input: values,
                });
              else await createProduct.mutateAsync(values);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer cet article ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deleting?.designation}</strong>. Impossible si l'article
            apparaît dans des documents commerciaux.
          </>
        }
        confirmLabel="Confirmer la suppression"
        isLoading={deleteProduct.isPending}
        onConfirm={async () => {
          if (deleting) {
            await deleteProduct.mutateAsync(deleting.id);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
