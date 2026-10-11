import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  createCompanyHandler,
  deleteCompanyHandler,
  getCompanyHandler,
  listCompaniesHandler,
  updateCompanyHandler,
  updateDirectorySettingsHandler,
} from "./companies.controller";
import analysesRouter from "@/modules/analyses/analyses.routes";
import employeesRouter from "@/modules/hr/employees/employees.routes";
import jobPositionsRouter from "@/modules/hr/jobPositions/jobPositions.routes";
import hrDashboardRouter from "@/modules/hr/dashboard/dashboard.routes";
import clientsRouter from "@/modules/invoicing/clients/clients.routes";
import productsRouter from "@/modules/invoicing/products/products.routes";
import documentsRouter from "@/modules/invoicing/documents/documents.routes";
import invoicingSettingsRouter from "@/modules/invoicing/settings/settings.routes";
import invoicingDashboardRouter from "@/modules/invoicing/dashboard/dashboard.routes";
import collectionsRouter from "@/modules/invoicing/collections/collections.routes";
import membersRouter from "@/modules/companies/members/members.routes";
import logoRouter from "@/modules/companies/logo/logo.routes";
import fixedAssetsRouter from "@/modules/fixedAssets/assets/assets.routes";
import fixedAssetSettingsRouter from "@/modules/fixedAssets/settings/settings.routes";
import fixedAssetDashboardRouter from "@/modules/fixedAssets/dashboard/dashboard.routes";
import companyMovementsRouter from "@/modules/fixedAssets/movements/companyMovements.routes";
import treasuryEntriesRouter from "@/modules/treasury/entries/entries.routes";
import businessPlansRouter from "@/modules/businessPlan/plan/plan.routes";
import treasurySettingsRouter from "@/modules/treasury/settings/settings.routes";
import taxSettingsRouter from "@/modules/fiscalite/settings/settings.routes";
import vatRouter from "@/modules/fiscalite/vat/vat.routes";
import corporateTaxRouter from "@/modules/fiscalite/corporateTax/corporateTax.routes";
import businessLicenseRouter from "@/modules/fiscalite/businessLicense/businessLicense.routes";
import payrollTaxRouter from "@/modules/fiscalite/payrollTax/payrollTax.routes";
import fiscalSummaryRouter from "@/modules/fiscalite/summary/summary.routes";
import treasuryBudgetRouter from "@/modules/treasury/budget/budget.routes";
import incomeBudgetRouter from "@/modules/accounting/incomeBudget/incomeBudget.routes";
import incomeBudgetComparisonRouter from "@/modules/accounting/incomeBudget/incomeBudgetComparison.routes";
import treasuryDashboardRouter from "@/modules/treasury/dashboard/dashboard.routes";
import chartOfAccountsRouter from "@/modules/accounting/chartOfAccounts/chartOfAccounts.routes";
import journalEntriesRouter, {
  trialBalanceRouter,
} from "@/modules/accounting/journalEntries/journalEntries.routes";
import suppliersRouter from "@/modules/purchasing/suppliers/suppliers.routes";
import purchaseDocumentsRouter from "@/modules/purchasing/documents/purchaseDocuments.routes";
import payablesRouter from "@/modules/purchasing/payables/payables.routes";
import paymentsJournalRouter from "@/modules/paymentsJournal/paymentsJournal.routes";
import auditLogRouter from "@/modules/auditLog/auditLog.routes";
import reconciliationRouter from "@/modules/treasury/reconciliation/reconciliation.routes";
import fiscalYearClosingRouter from "@/modules/accounting/fiscalYearClosing/fiscalYearClosing.routes";
import vatSummaryRouter from "@/modules/accounting/vatSummary/vatSummary.routes";
import jobPostingsRouter from "@/modules/jobPostings/jobPostings.routes";
import companyNotificationsRouter from "@/modules/companyNotifications/companyNotifications.routes";
import companyConversationsRouter from "@/modules/conversations/companyConversations.routes";
import {
  listRouter as jobApplicationsListRouter,
  statusRouter as jobApplicationsStatusRouter,
} from "@/modules/jobApplications/jobApplications.routes";

const router = Router();

router.use(requireAuth);

router.get("/", listCompaniesHandler);
router.post("/", createCompanyHandler);
router.get("/:id", getCompanyHandler);
router.put("/:id", updateCompanyHandler);
router.patch("/:id/directory-settings", updateDirectorySettingsHandler);
router.delete("/:id", deleteCompanyHandler);

// Membres de l'entreprise (accès admin — géré dans le service)
router.use("/:companyId/members", membersRouter);
router.use("/:companyId/logo", logoRouter);

// Module financier
router.use("/:companyId/analyses", analysesRouter);

// Module RH
router.use("/:companyId/employees", employeesRouter);
router.use("/:companyId/job-positions", jobPositionsRouter);
router.use("/:companyId/hr/dashboard", hrDashboardRouter);

// Module Facturation & Inventaire
router.use("/:companyId/clients", clientsRouter);
router.use("/:companyId/products", productsRouter);
router.use("/:companyId/documents", documentsRouter);
router.use("/:companyId/invoicing/settings", invoicingSettingsRouter);
router.use("/:companyId/invoicing/dashboard", invoicingDashboardRouter);
router.use("/:companyId/invoicing/collections", collectionsRouter);

// Module Immobilisations
router.use("/:companyId/fixed-assets/settings", fixedAssetSettingsRouter);
router.use("/:companyId/fixed-assets/dashboard", fixedAssetDashboardRouter);
router.use("/:companyId/fixed-assets/movements", companyMovementsRouter);
router.use("/:companyId/fixed-assets", fixedAssetsRouter);

// Module Trésorerie
router.use("/:companyId/treasury/settings", treasurySettingsRouter);
router.use("/:companyId/fiscalite/settings", taxSettingsRouter);
router.use("/:companyId/fiscalite/tva", vatRouter);
router.use("/:companyId/fiscalite/is", corporateTaxRouter);
router.use("/:companyId/fiscalite/patente", businessLicenseRouter);
router.use("/:companyId/fiscalite/cnps-ir", payrollTaxRouter);
router.use("/:companyId/fiscalite", fiscalSummaryRouter);
router.use("/:companyId/treasury/dashboard", treasuryDashboardRouter);
router.use("/:companyId/treasury/budget", treasuryBudgetRouter);
router.use("/:companyId/accounting/income-budget", incomeBudgetRouter);
router.use(
  "/:companyId/accounting/income-budget-comparison",
  incomeBudgetComparisonRouter,
);
router.use("/:companyId/treasury/entries", treasuryEntriesRouter);

// Module Business Plan
router.use("/:companyId/business-plans", businessPlansRouter);

// Module Comptabilité générale
router.use("/:companyId/accounting/chart-of-accounts", chartOfAccountsRouter);
router.use("/:companyId/accounting/journal-entries", journalEntriesRouter);
router.use("/:companyId/accounting/trial-balance", trialBalanceRouter);
router.use("/:companyId/accounting/fiscal-years", fiscalYearClosingRouter);
router.use("/:companyId/accounting/vat-summary", vatSummaryRouter);

// Module Achats & Fournisseurs
router.use("/:companyId/suppliers", suppliersRouter);
router.use("/:companyId/purchase-documents", purchaseDocumentsRouter);
router.use("/:companyId/purchasing/payables", payablesRouter);
router.use("/:companyId/payments-journal", paymentsJournalRouter);
router.use("/:companyId/audit-log", auditLogRouter);
router.use("/:companyId/treasury/reconciliation", reconciliationRouter);
router.use("/:companyId/job-postings", jobPostingsRouter);
router.use("/:companyId/notifications", companyNotificationsRouter);
router.use("/:companyId/conversations", companyConversationsRouter);
router.use(
  "/:companyId/job-postings/:jobPostingId/applications",
  jobApplicationsListRouter,
);
router.use("/:companyId/job-applications", jobApplicationsStatusRouter);

export default router;
