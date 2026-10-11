import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Pencil, ShieldCheck } from "lucide-react";
import {
  useCompany,
  useUpdateCompany,
} from "@/features/companies/companies.api";
import CompanyForm from "@/features/companies/CompanyForm";
import ClientsTab from "@/features/invoicing/ClientsTab";
import ProductsTab from "@/features/invoicing/ProductsTab";
import DocumentsTab from "@/features/invoicing/DocumentsTab";
import CollectionsPayablesTab from "@/features/collections/CollectionsPayablesTab";
import InvoicingDashboardTab from "@/features/invoicing/InvoicingDashboardTab";
import SettingsTab from "@/features/invoicing/SettingsTab";
import EmployeesTab from "@/features/hr/EmployeesTab";
import JobPostingsTab from "@/features/jobPostings/JobPostingsTab";
import MessagesTab from "@/features/conversations/MessagesTab";
import AnalysesTab from "@/features/finance/AnalysesTab";
import MembersTab from "@/features/companies/MembersTab";
import AssetsTab from "@/features/fixedAssets/AssetsTab";
import FiscaliteTab from "@/features/fiscalite/FiscaliteTab";
import TreasuryTab from "@/features/treasury/TreasuryTab";
import PaymentsJournalTab from "@/features/paymentsJournal/PaymentsJournalTab";
import BusinessPlansTab from "@/features/businessPlan/BusinessPlansTab";
import AccountingTab from "@/features/accounting/AccountingTab";
import SuppliersTab from "@/features/purchasing/SuppliersTab";
import PurchaseDocumentsTab from "@/features/purchasing/PurchaseDocumentsTab";
import AuditLogTab from "@/features/auditLog/AuditLogTab";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext/context";
import { CompanyInput } from "@/types";
import { usePublishCurrentCompany } from "@/hooks/usePublishCurrentCompany";
import CurrencyProvider from "@/context/CurrencyContext";

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { data: company } = useCompany(companyId);
  const updateCompany = useUpdateCompany(companyId as string);
  const { isSuperAdmin } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  // La navigation entre modules vit désormais dans la sidebar globale
  // (AppSidebar) — l'onglet actif est piloté par l'URL (?tab=...) plutôt que
  // par un state purement local, pour que les liens de la sidebar fonctionnent
  // et que l'onglet ouvert survive à un rafraîchissement de page.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "dashboard";
  function setActiveTab(value: string) {
    setSearchParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true },
    );
  }

  usePublishCurrentCompany(
    company ? { id: company.id, name: company.name } : undefined,
  );

  if (!companyId) return null;

  const editValues: CompanyInput | undefined = company
    ? {
        name: company.name,
        country: company.country,
        currency: company.currency,
        sector: company.sector ?? "",
        address: company.address ?? "",
        accountingSystem: company.accountingSystem,
        fiscalRegime: company.fiscalRegime ?? "",
      }
    : undefined;

  return (
    <CurrencyProvider currency={company?.currency}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/app/entreprises"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Toutes les entreprises
        </Link>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-medium text-foreground">
                {company?.name}
              </h1>
              {isSuperAdmin && company?.user && (
                <Badge variant="outline" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />{" "}
                  {company.user.fullName || company.user.email}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {company?.sector} · {company?.country} · {company?.currency}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Modifier l'entreprise
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <div>
            <TabsContent value="dashboard">
              <InvoicingDashboardTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="documents">
              <DocumentsTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="clients">
              <ClientsTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="products">
              <ProductsTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="purchases">
              <PurchaseDocumentsTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="suppliers">
              <SuppliersTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="finance">
              <AnalysesTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="accounting">
              <AccountingTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="treasury">
              <TreasuryTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="payments-journal">
              <PaymentsJournalTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="collections">
              <CollectionsPayablesTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="assets">
              <AssetsTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="fiscalite">
              <FiscaliteTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="business-plans">
              <BusinessPlansTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="hr">
              <EmployeesTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="job-postings">
              <JobPostingsTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="messages">
              <MessagesTab
                companyId={companyId as string}
                initialConversationId={
                  searchParams.get("conversation") ?? undefined
                }
              />
            </TabsContent>
            <TabsContent value="activity">
              <AuditLogTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="members">
              <MembersTab companyId={companyId} />
            </TabsContent>
            <TabsContent value="settings">
              <SettingsTab companyId={companyId} />
            </TabsContent>
          </div>
        </Tabs>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'entreprise</DialogTitle>
            </DialogHeader>
            {editValues && (
              <CompanyForm
                initialValues={editValues}
                submitLabel="Enregistrer les modifications"
                onSubmit={async (values) => {
                  await updateCompany.mutateAsync(values);
                  setEditOpen(false);
                }}
                onCancel={() => setEditOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </CurrencyProvider>
  );
}
