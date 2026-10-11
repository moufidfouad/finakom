import { useState } from "react";
import { Plus, Pencil, Trash2, Users, Download, Tag } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Client, ClientInput } from "@/types";
import {
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from "./clients.api";
import { useProducts } from "./products.api";
import ClientForm from "./ClientForm";
import ClientCreditBadge from "./ClientCreditBadge";
import NegotiatedPricesDialog from "./NegotiatedPricesDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

export default function ClientsTab({ companyId }: { companyId: string }) {
  const { data: clients, isLoading } = useClients(companyId);
  const { data: products } = useProducts(companyId);
  const createClient = useCreateClient(companyId);
  const updateClient = useUpdateClient(companyId);
  const deleteClient = useDeleteClient(companyId);

  const [pricingClient, setPricingClient] = useState<Client | null>(null);

  const table = useDataTable(clients, {
    searchFields: (c) => [c.name, c.code, c.email, c.phone],
    sortAccessors: {
      code: (c) => c.code,
      name: (c) => c.name,
      quality: (c) => c.quality,
    },
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(c: Client) {
    setEditing(c);
    setFormOpen(true);
  }

  const editValues: ClientInput | undefined = editing
    ? {
        name: editing.name,
        type: editing.type,
        address: editing.address ?? "",
        phone: editing.phone ?? "",
        email: editing.email ?? "",
        rccm: editing.rccm ?? "",
        quality: editing.quality,
        creditLimit: editing.creditLimit ? Number(editing.creditLimit) : "",
        defaultDiscountPercent:
          editing.defaultDiscountPercent !== null
            ? Number(editing.defaultDiscountPercent)
            : "",
      }
    : undefined;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {clients ? `${clients.length} client(s)` : "Chargement…"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `${apiClient.defaults.baseURL}/companies/${companyId}/clients/export.csv`,
                "_blank",
              )
            }
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="accent" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nouveau client
          </Button>
        </div>
      </div>

      {clients && clients.length > 0 && (
        <div className="mt-3">
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Rechercher un client…"
          />
        </div>
      )}

      <div className="mt-4">
        {isLoading && <LoadingState />}

        {clients && clients.length === 0 && (
          <EmptyState
            icon={Users}
            message="Aucun client enregistré pour cette entreprise."
          />
        )}

        {clients && clients.length > 0 && table.totalCount === 0 && (
          <EmptyState
            icon={Users}
            message="Aucun client ne correspond à cette recherche."
          />
        )}

        {clients && table.totalCount > 0 && (
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
                    Qualité
                  </SortableTableHead>
                  <TableHead className="hidden lg:table-cell">
                    Encours
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">
                      {c.code}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {c.type}
                    </TableCell>
                    <TableCell className="hidden max-w-40 truncate md:table-cell text-muted-foreground">
                      {c.phone || c.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={qualityVariant[c.quality] ?? "secondary"}>
                        {c.quality}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <ClientCreditBadge
                        clientId={c.id}
                        hasLimit={c.creditLimit !== null}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPricingClient(c)}
                        aria-label="Prix négociés"
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(c)}
                        aria-label="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleting(c)}
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
              {editing ? "Modifier le client" : "Nouveau client"}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            initialValues={editValues}
            submitLabel={editing ? "Enregistrer" : "Ajouter le client"}
            onSubmit={async (values) => {
              if (editing)
                await updateClient.mutateAsync({
                  id: editing.id,
                  input: values,
                });
              else await createClient.mutateAsync(values);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer ce client ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deleting?.name}</strong>. Impossible si des documents
            commerciaux y sont associés.
          </>
        }
        confirmLabel="Confirmer la suppression"
        isLoading={deleteClient.isPending}
        onConfirm={async () => {
          if (deleting) {
            await deleteClient.mutateAsync(deleting.id);
            setDeleting(null);
          }
        }}
      />

      {pricingClient && (
        <NegotiatedPricesDialog
          client={pricingClient}
          products={products ?? []}
          onClose={() => setPricingClient(null)}
        />
      )}
    </div>
  );
}
