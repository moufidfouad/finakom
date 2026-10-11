import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  BusinessPlanFunding,
  BusinessPlanInvestment,
  BusinessPlanSupplier,
  BusinessPlanSupplierInput,
  FundingInput,
  InvestmentInput,
} from "@/types";
import { investmentsApi, fundingsApi, suppliersApi } from "./subResources.api";
import { FUNDING_TYPES } from "./businessPlan.constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import FormSelectField from "@/components/form/FormSelectField";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { getApiErrorMessage } from "@/lib/apiError";

function InvestmentForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: InvestmentInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <Formik
      initialValues={
        {
          category: "",
          description: "",
          amount: 0,
          notes: "",
        } as InvestmentInput
      }
      validationSchema={Yup.object({
        category: Yup.string().min(2).required("Requis"),
        description: Yup.string().min(2).required("Requis"),
        amount: Yup.number().positive().required("Requis"),
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
            name="category"
            label="Catégorie"
            placeholder="Matériel, Local, Stock initial…"
          />
          <FormTextField name="description" label="Description" />
          <FormTextField name="amount" label="Montant" type="number" />
          <FormTextField name="notes" label="Notes (optionnel)" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Ajouter
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

function FundingForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: FundingInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <Formik
      initialValues={
        {
          type: "Apport personnel",
          detail: "",
          amount: 0,
          notes: "",
        } as FundingInput
      }
      validationSchema={Yup.object({
        type: Yup.string().required(),
        detail: Yup.string().min(2).required("Requis"),
        amount: Yup.number().positive().required("Requis"),
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
          <FormSelectField
            name="type"
            label="Type de ressource"
            options={FUNDING_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <FormTextField name="detail" label="Détail / origine" />
          <FormTextField name="amount" label="Montant" type="number" />
          <FormTextField name="notes" label="Notes (optionnel)" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Ajouter
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

function SupplierForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: BusinessPlanSupplierInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <Formik
      initialValues={
        {
          name: "",
          supplyType: "",
          annualAmount: 0,
          notes: "",
        } as BusinessPlanSupplierInput
      }
      validationSchema={Yup.object({
        name: Yup.string().min(2).required("Requis"),
        supplyType: Yup.string().min(2).required("Requis"),
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
          <FormTextField name="name" label="Fournisseur" />
          <FormTextField name="supplyType" label="Type de fourniture" />
          <FormTextField
            name="annualAmount"
            label="Montant annuel estimé"
            type="number"
          />
          <FormTextField name="notes" label="Notes (optionnel)" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Ajouter
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

export default function InvestmentFundingTab({
  planId,
  canEdit,
}: {
  planId: string;
  canEdit: boolean;
}) {
  const formatAmount = useFormatAmount();
  const { data: investments } = investmentsApi.useList(planId);
  const { data: fundings } = fundingsApi.useList(planId);
  const { data: suppliers } = suppliersApi.useList(planId);
  const createInvestment = investmentsApi.useCreate(planId);
  const deleteInvestment = investmentsApi.useDelete(planId);
  const createFunding = fundingsApi.useCreate(planId);
  const deleteFunding = fundingsApi.useDelete(planId);
  const createSupplier = suppliersApi.useCreate(planId);
  const deleteSupplier = suppliersApi.useDelete(planId);

  const [investmentFormOpen, setInvestmentFormOpen] = useState(false);
  const [fundingFormOpen, setFundingFormOpen] = useState(false);
  const [supplierFormOpen, setSupplierFormOpen] = useState(false);
  const [deletingInvestment, setDeletingInvestment] =
    useState<BusinessPlanInvestment | null>(null);
  const [deletingFunding, setDeletingFunding] =
    useState<BusinessPlanFunding | null>(null);
  const [deletingSupplier, setDeletingSupplier] =
    useState<BusinessPlanSupplier | null>(null);

  const totalInvestment = (investments ?? []).reduce(
    (s, i) => s + Number(i.amount),
    0,
  );
  const totalFunding = (fundings ?? []).reduce(
    (s, f) => s + Number(f.amount),
    0,
  );
  const balance = totalFunding - totalInvestment;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between rounded-md border border-border bg-secondary/40 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Solde financement
          </p>
          <p className="tabular font-display text-2xl font-medium text-foreground">
            {formatAmount(balance)}
          </p>
        </div>
        <Badge variant={balance >= 0 ? "success" : "destructive"}>
          {balance >= 0
            ? "✅ Financement suffisant"
            : "⚠️ Financement insuffisant"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">
              Besoins — Investissement de départ
            </CardTitle>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInvestmentFormOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  {canEdit && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(investments ?? []).map((i: BusinessPlanInvestment) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <p className="font-medium">{i.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.description}
                      </p>
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatAmount(Number(i.amount))}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingInvestment(i)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t border-border p-3 text-right text-sm font-medium">
              Total : {formatAmount(totalInvestment)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">
              Ressources / Financements
            </CardTitle>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFundingFormOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  {canEdit && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(fundings ?? []).map((f: BusinessPlanFunding) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <p className="font-medium">{f.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {f.detail}
                      </p>
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatAmount(Number(f.amount))}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingFunding(f)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t border-border p-3 text-right text-sm font-medium">
              Total : {formatAmount(totalFunding)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Fournisseurs pressentis</CardTitle>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSupplierFormOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Montant annuel</TableHead>
                {canEdit && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(suppliers ?? []).map((s: BusinessPlanSupplier) => (
                <TableRow key={s.id}>
                  <TableCell>{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.supplyType}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatAmount(Number(s.annualAmount))}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingSupplier(s)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={investmentFormOpen} onOpenChange={setInvestmentFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau besoin d'investissement</DialogTitle>
          </DialogHeader>
          <InvestmentForm
            onSubmit={async (v) => {
              await createInvestment.mutateAsync(v);
              setInvestmentFormOpen(false);
            }}
            onCancel={() => setInvestmentFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={fundingFormOpen} onOpenChange={setFundingFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle ressource de financement</DialogTitle>
          </DialogHeader>
          <FundingForm
            onSubmit={async (v) => {
              await createFunding.mutateAsync(v);
              setFundingFormOpen(false);
            }}
            onCancel={() => setFundingFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={supplierFormOpen} onOpenChange={setSupplierFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau fournisseur</DialogTitle>
          </DialogHeader>
          <SupplierForm
            onSubmit={async (v) => {
              await createSupplier.mutateAsync(v);
              setSupplierFormOpen(false);
            }}
            onCancel={() => setSupplierFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingInvestment}
        onOpenChange={(o) => !o && setDeletingInvestment(null)}
        title="Supprimer ce besoin d'investissement ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deletingInvestment?.category}</strong> (
            {deletingInvestment &&
              formatAmount(Number(deletingInvestment.amount))}
            ). Irréversible.
          </>
        }
        confirmLabel="Confirmer la suppression"
        isLoading={deleteInvestment.isPending}
        onConfirm={async () => {
          if (deletingInvestment) {
            await deleteInvestment.mutateAsync(deletingInvestment.id);
            setDeletingInvestment(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!deletingFunding}
        onOpenChange={(o) => !o && setDeletingFunding(null)}
        title="Supprimer cette ressource de financement ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deletingFunding?.type}</strong> (
            {deletingFunding && formatAmount(Number(deletingFunding.amount))}).
            Irréversible.
          </>
        }
        confirmLabel="Confirmer la suppression"
        isLoading={deleteFunding.isPending}
        onConfirm={async () => {
          if (deletingFunding) {
            await deleteFunding.mutateAsync(deletingFunding.id);
            setDeletingFunding(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!deletingSupplier}
        onOpenChange={(o) => !o && setDeletingSupplier(null)}
        title="Supprimer ce fournisseur pressenti ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deletingSupplier?.name}</strong>. Irréversible.
          </>
        }
        confirmLabel="Confirmer la suppression"
        isLoading={deleteSupplier.isPending}
        onConfirm={async () => {
          if (deletingSupplier) {
            await deleteSupplier.mutateAsync(deletingSupplier.id);
            setDeletingSupplier(null);
          }
        }}
      />
    </div>
  );
}
