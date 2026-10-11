import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  FileText,
  FileText as SectionsIcon,
  Landmark,
  Pencil,
  Scale,
  TrendingUp,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  useBusinessPlan,
  useDeleteBusinessPlan,
  useUpdateBusinessPlan,
} from "@/features/businessPlan/plan.api";
import { useBusinessPlanSummary } from "@/features/businessPlan/summary.api";
import SummaryTab from "@/features/businessPlan/SummaryTab";
import InvestmentFundingTab from "@/features/businessPlan/InvestmentFundingTab";
import ProfitLossTab from "@/features/businessPlan/ProfitLossTab";
import CashflowTab from "@/features/businessPlan/CashflowTab";
import BalanceTab from "@/features/businessPlan/BalanceTab";
import NarrativeTab from "@/features/businessPlan/NarrativeTab";
import { useCompanyPermissions } from "@/features/companies/useCompanyPermissions";
import { useCompany } from "@/features/companies/companies.api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePublishCurrentCompany } from "@/hooks/usePublishCurrentCompany";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FormTextField from "@/components/form/FormTextField";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { getApiErrorMessage } from "@/lib/apiError";
import { apiClient } from "@/lib/axios";
import { LoadingState } from "@/components/ui/loading-state";
import CurrencyProvider from "@/context/CurrencyContext";

const BP_TAB_ITEMS = [
  { value: "summary", label: "Résumé", icon: BarChart3 },
  { value: "investment", label: "Investissement", icon: Landmark },
  { value: "pl", label: "Compte de résultat", icon: TrendingUp },
  { value: "cashflow", label: "Trésorerie", icon: Wallet },
  { value: "balance", label: "Bilan", icon: Scale },
  { value: "narrative", label: "Sections", icon: SectionsIcon },
] as const;

export default function BusinessPlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading } = useBusinessPlan(planId);
  const { data: summary } = useBusinessPlanSummary(planId);
  const updatePlan = useUpdateBusinessPlan(plan?.companyId ?? "");
  const deletePlan = useDeleteBusinessPlan(plan?.companyId ?? "");
  const { canModify } = useCompanyPermissions(plan?.companyId);
  const { data: company } = useCompany(plan?.companyId);
  usePublishCurrentCompany(
    company ? { id: company.id, name: company.name } : undefined,
  );

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading || !plan)
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <LoadingState />
      </div>
    );

  const canEdit = canModify(plan.createdById);

  return (
    <CurrencyProvider currency={company?.currency}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to={`/app/entreprises/${plan.companyId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Retour à l'entreprise
        </Link>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-medium text-foreground">
                {plan.title}
              </h1>
              <Badge
                variant={plan.status === "Finalisé" ? "success" : "secondary"}
              >
                {plan.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Horizon {plan.horizonYears} an(s)
              {plan.createdBy &&
                ` · Créé par ${plan.createdBy.fullName || plan.createdBy.email}`}
            </p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `${apiClient.defaults.baseURL}/business-plans/${plan.id}/pdf`,
                    "_blank",
                  )
                }
              >
                <FileText className="h-4 w-4" /> Voir le PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" /> Modifier
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="summary" className="mt-8">
          <div
            className="-mx-4 overflow-x-auto border-b border-border px-4 [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: "none" }}
          >
            <TabsList className="h-auto w-max justify-start gap-1 rounded-none border-0 bg-transparent p-0">
              {BP_TAB_ITEMS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="shrink-0 gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-sm text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Icon className="h-4 w-4" /> {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="mt-6">
            <TabsContent value="summary">
              {summary && <SummaryTab summary={summary} />}
            </TabsContent>
            <TabsContent value="investment">
              <InvestmentFundingTab planId={plan.id} canEdit={canEdit} />
            </TabsContent>
            <TabsContent value="pl">
              <ProfitLossTab
                planId={plan.id}
                horizonYears={plan.horizonYears}
                canEdit={canEdit}
                plByYear={summary?.profitLoss.byYear ?? {}}
              />
            </TabsContent>
            <TabsContent value="cashflow">
              <CashflowTab
                planId={plan.id}
                canEdit={canEdit}
                schedule={summary?.cashflow.schedule ?? []}
              />
            </TabsContent>
            <TabsContent value="balance">
              <BalanceTab
                planId={plan.id}
                horizonYears={plan.horizonYears}
                canEdit={canEdit}
                balanceByYear={summary?.balance.byYear ?? {}}
              />
            </TabsContent>
            <TabsContent value="narrative">
              <NarrativeTab
                planId={plan.id}
                companyId={plan.companyId}
                canEdit={canEdit}
                sections={plan.narrativeSections}
              />
            </TabsContent>
          </div>
        </Tabs>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le business plan</DialogTitle>
            </DialogHeader>
            <EditPlanForm
              initialValues={{
                title: plan.title,
                status: plan.status,
                horizonYears: plan.horizonYears,
              }}
              onSubmit={async (values) => {
                await updatePlan.mutateAsync({ id: plan.id, input: values });
                setEditOpen(false);
              }}
              onCancel={() => setEditOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Supprimer ce business plan ?"
          description={
            <>
              Cette action supprimera définitivement{" "}
              <strong>{plan.title}</strong> et toutes ses données. Irréversible.
            </>
          }
          confirmLabel="Confirmer la suppression"
          isLoading={deletePlan.isPending}
          onConfirm={async () => {
            await deletePlan.mutateAsync(plan.id);
            navigate(`/app/entreprises/${plan.companyId}`);
          }}
        />
      </div>
    </CurrencyProvider>
  );
}

interface EditPlanValues {
  title: string;
  status: "Brouillon" | "Finalisé";
  horizonYears: number;
}

function EditPlanForm({
  initialValues,
  onSubmit,
  onCancel,
}: {
  initialValues: EditPlanValues;
  onSubmit: (v: EditPlanValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={Yup.object({
        title: Yup.string().min(2, "Requis").required("Requis"),
        horizonYears: Yup.number().min(1).max(5).required(),
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
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FormTextField name="title" label="Titre du business plan" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Statut</label>
            <Select
              value={values.status}
              onValueChange={(v) => setFieldValue("status", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Brouillon">Brouillon</SelectItem>
                <SelectItem value="Finalisé">Finalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FormTextField
            name="horizonYears"
            label="Horizon (années)"
            type="number"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Enregistrer
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
