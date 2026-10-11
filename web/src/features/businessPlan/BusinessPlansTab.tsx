import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Target, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { BusinessPlan, CreateBusinessPlanInput } from "@/types";
import {
  useBusinessPlans,
  useCreateBusinessPlan,
  useDeleteBusinessPlan,
} from "./plan.api";
import { useCompanyPermissions } from "@/features/companies/useCompanyPermissions";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import FormTextField from "@/components/form/FormTextField";
import { formatDate } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/apiError";
import { LoadingState } from "@/components/ui/loading-state";
import { useDataTable } from "@/hooks/useDataTable";
import { SearchBar } from "@/components/ui/search-bar";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { TablePagination } from "@/components/ui/table-pagination";

function CreatePlanForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: CreateBusinessPlanInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <Formik
      initialValues={{ title: "", horizonYears: 3 } as CreateBusinessPlanInput}
      validationSchema={Yup.object({
        title: Yup.string().min(2, "Requis").required("Requis"),
        horizonYears: Yup.number().min(1).max(5),
      })}
      onSubmit={async (v, { setSubmitting }) => {
        setError("");
        try {
          await onSubmit(v);
        } catch (e) {
          setError(getApiErrorMessage(e));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FormTextField
            name="title"
            label="Titre du business plan"
            placeholder="Lancement — Boutique en ligne"
          />
          <FormTextField
            name="horizonYears"
            label="Horizon (années)"
            type="number"
            hint="Sur combien d'années projeter le compte de résultat et le bilan (1 à 5, 3 par défaut)."
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Créer le business plan
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export default function BusinessPlansTab({ companyId }: { companyId: string }) {
  const navigate = useNavigate();
  const { data: plans, isLoading } = useBusinessPlans(companyId);
  const createPlan = useCreateBusinessPlan(companyId);
  const deletePlan = useDeleteBusinessPlan(companyId);
  const { canModify } = useCompanyPermissions(companyId);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<BusinessPlan | null>(null);

  const table = useDataTable(plans, {
    searchFields: (p) => [p.title, p.createdBy?.fullName, p.createdBy?.email],
    sortAccessors: {
      title: (p) => p.title,
      status: (p) => p.status,
      updatedAt: (p) => p.updatedAt,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {plans ? `${plans.length} business plan(s)` : "Chargement…"}
        </p>
        <Button variant="accent" size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Nouveau business plan
        </Button>
      </div>
      {plans && plans.length > 0 && (
        <div className="mt-4">
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Rechercher un business plan…"
          />
        </div>
      )}
      <div className="mt-4">
        {isLoading && <LoadingState />}

        {plans && plans.length === 0 && (
          <EmptyState
            icon={Target}
            message="Aucun business plan pour le moment."
          />
        )}

        {plans && plans.length > 0 && table.totalCount === 0 && (
          <EmptyState
            icon={Target}
            message="Aucun business plan ne correspond à cette recherche."
          />
        )}

        {plans && table.totalCount > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortKey="title"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Titre
                  </SortableTableHead>
                  <TableHead className="hidden sm:table-cell">
                    Horizon
                  </TableHead>
                  <SortableTableHead
                    sortKey="status"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Statut
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="updatedAt"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                    className="hidden md:table-cell"
                  >
                    Mis à jour
                  </SortableTableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.data.map((p: BusinessPlan) => {
                  const editable = canModify(p.createdById);
                  return (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/app/business-plans/${p.id}`)}
                    >
                      <TableCell>
                        <p className="font-medium">{p.title}</p>
                        {p.createdBy && (
                          <p className="text-xs text-muted-foreground">
                            par {p.createdBy.fullName || p.createdBy.email}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {p.horizonYears} an(s)
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "Finalisé" ? "success" : "secondary"
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatDate(p.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {editable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleting(p);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
            <DialogTitle>Nouveau business plan</DialogTitle>
          </DialogHeader>
          <CreatePlanForm
            onSubmit={async (values) => {
              const plan = await createPlan.mutateAsync(values);
              setFormOpen(false);
              navigate(`/app/business-plans/${plan.id}`);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer ce business plan ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deleting?.title}</strong>, y compris tous ses
            investissements, financements, fournisseurs et projections.
            Irréversible.
          </>
        }
        confirmLabel="Confirmer la suppression"
        isLoading={deletePlan.isPending}
        onConfirm={async () => {
          if (deleting) {
            await deletePlan.mutateAsync(deleting.id);
            setDeleting(null);
          }
        }}
      />{" "}
    </div>
  );
}
