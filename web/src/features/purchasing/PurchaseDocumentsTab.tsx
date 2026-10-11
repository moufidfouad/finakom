import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Download } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useSuppliers } from "./suppliers.api";
import {
  useCreatePurchaseDocument,
  usePurchaseDocuments,
} from "./purchaseDocuments.api";
import { useProducts } from "@/features/invoicing/products.api";
import PurchaseDocumentForm from "./PurchaseDocumentForm";
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
import { formatDate } from "@/lib/format";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { apiClient } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { PurchaseDocumentType } from "@/types";
import { LoadingState } from "@/components/ui/loading-state";
import { useDataTable } from "@/hooks/useDataTable";
import { SearchBar } from "@/components/ui/search-bar";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { TablePagination } from "@/components/ui/table-pagination";

const statusVariant: Record<
  string,
  "success" | "accent" | "destructive" | "secondary"
> = {
  Payée: "success",
  Confirmé: "success",
  Partielle: "accent",
  Envoyé: "secondary",
  Impayée: "destructive",
  Annulé: "destructive",
};

const TYPE_FILTERS: { value: PurchaseDocumentType | "Tous"; label: string }[] =
  [
    { value: "Tous", label: "Tous" },
    { value: "Bon de commande", label: "Bons de commande" },
    { value: "Facture fournisseur", label: "Factures fournisseurs" },
  ];

export default function PurchaseDocumentsTab({
  companyId,
}: {
  companyId: string;
}) {
  const formatAmount = useFormatAmount();
  const [typeFilter, setTypeFilter] = useState<PurchaseDocumentType | "Tous">(
    "Tous",
  );
  const { data: documents, isLoading } = usePurchaseDocuments(
    companyId,
    typeFilter === "Tous" ? {} : { type: typeFilter },
  );
  const { data: suppliers } = useSuppliers(companyId);
  const { data: products } = useProducts(companyId);
  const createDocument = useCreatePurchaseDocument(companyId);

  const [formOpen, setFormOpen] = useState(false);
  const [newType, setNewType] =
    useState<PurchaseDocumentType>("Bon de commande");

  function effectiveStatus(d: NonNullable<typeof documents>[number]) {
    return d.type === "Facture fournisseur"
      ? (d.paymentSummary?.status ?? d.status)
      : d.status;
  }

  const table = useDataTable(documents, {
    searchFields: (d) => [d.number, d.supplier?.name],
    sortAccessors: {
      number: (d) => d.number,
      date: (d) => d.date,
      supplier: (d) => d.supplier?.name ?? "",
      amount: (d) => d.totals.totalTTC,
      status: (d) => effectiveStatus(d),
    },
  });

  function openCreate(type: PurchaseDocumentType) {
    setNewType(type);
    setFormOpen(true);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 rounded-lg bg-secondary/60 p-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                typeFilter === f.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `${apiClient.defaults.baseURL}/companies/${companyId}/purchase-documents/export.csv`,
                "_blank",
              )
            }
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => openCreate("Bon de commande")}
          >
            <Plus className="h-4 w-4" /> Bon de commande
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openCreate("Facture fournisseur")}
          >
            Facture fournisseur
          </Button>
        </div>
      </div>

      {documents && documents.length > 0 && (
        <div className="mt-4">
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Rechercher un document…"
          />
        </div>
      )}

      <div className="mt-4">
        {isLoading && <LoadingState />}

        {documents && documents.length === 0 && (
          <EmptyState
            icon={FileText}
            message="Aucun document d'achat pour le moment."
          />
        )}

        {documents && documents.length > 0 && table.totalCount === 0 && (
          <EmptyState
            icon={FileText}
            message="Aucun document ne correspond à cette recherche."
          />
        )}

        {documents && table.totalCount > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortKey="number"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    N°
                  </SortableTableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <SortableTableHead
                    sortKey="supplier"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Fournisseur
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="date"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                    className="hidden md:table-cell"
                  >
                    Date
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="amount"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                    className="text-right"
                  >
                    Montant TTC
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="status"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Statut
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.data.map((d) => {
                  const status = effectiveStatus(d);
                  return (
                    <TableRow key={d.id} className="cursor-pointer">
                      <TableCell>
                        <Link
                          to={`/app/purchase-documents/${d.id}`}
                          className="font-mono text-xs font-medium text-primary hover:underline"
                        >
                          {d.number}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {d.type}
                      </TableCell>
                      <TableCell className="max-w-40 truncate">
                        {d.supplier?.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatDate(d.date)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {formatAmount(d.totals.totalTTC)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[status] ?? "secondary"}>
                          {status}
                        </Badge>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau {newType.toLowerCase()}</DialogTitle>
          </DialogHeader>
          <PurchaseDocumentForm
            suppliers={suppliers ?? []}
            products={products ?? []}
            defaultType={newType}
            onSubmit={async (values) => {
              await createDocument.mutateAsync({
                type: values.type,
                supplierId: values.supplierId,
                date: values.date,
                notes: values.notes,
                lines: values.lines ?? [],
              });
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
