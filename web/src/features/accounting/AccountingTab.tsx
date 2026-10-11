import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChartOfAccountsTab from "./ChartOfAccountsTab";
import JournalEntriesTab from "./JournalEntriesTab";
import TrialBalanceTab from "./TrialBalanceTab";
import FiscalYearClosingTab from "./FiscalYearClosingTab";
import VatSummaryTab from "./VatSummaryTab";
import IncomeBudgetTab from "./IncomeBudgetTab";

export default function AccountingTab({ companyId }: { companyId: string }) {
  return (
    <Tabs defaultValue="entries">
      <TabsList>
        <TabsTrigger value="entries">Écritures</TabsTrigger>
        <TabsTrigger value="chart">Plan comptable</TabsTrigger>
        <TabsTrigger value="balance">Balance générale</TabsTrigger>
        <TabsTrigger value="budget">Budget prévisionnel</TabsTrigger>
        <TabsTrigger value="vat">Synthèse TVA</TabsTrigger>
        <TabsTrigger value="closing">Clôture d'exercice</TabsTrigger>
      </TabsList>
      <div className="mt-4">
        <TabsContent value="entries">
          <JournalEntriesTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="chart">
          <ChartOfAccountsTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="balance">
          <TrialBalanceTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="budget">
          <IncomeBudgetTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="vat">
          <VatSummaryTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="closing">
          <FiscalYearClosingTab companyId={companyId} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
