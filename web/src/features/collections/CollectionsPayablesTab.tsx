import { Wallet, Truck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AgingReportView } from "@/components/common/reports/AgingReportView";
import { useCollectionsReport } from "@/features/invoicing/collections.api";
import { usePayablesReport } from "@/features/purchasing/payables.api";

/**
 * Recouvrement unifié — réunit le suivi des créances clients et des dettes
 * fournisseurs sous un seul point d'entrée avec bascule interne, plutôt que
 * deux onglets dispersés dans des groupes de navigation différents
 * (Commercial et Achats). Même principe que le Journal des règlements, qui
 * réunit déjà encaissements et décaissements dans une seule vue.
 */
export default function CollectionsPayablesTab({
  companyId,
}: {
  companyId: string;
}) {
  const { data: collectionsReport, isLoading: collectionsLoading } =
    useCollectionsReport(companyId);
  const { data: payablesReport, isLoading: payablesLoading } =
    usePayablesReport(companyId);

  return (
    <Tabs defaultValue="clients">
      <TabsList>
        <TabsTrigger value="clients">Clients</TabsTrigger>
        <TabsTrigger value="fournisseurs">Fournisseurs</TabsTrigger>
      </TabsList>
      <div className="mt-4">
        <TabsContent value="clients">
          <AgingReportView
            report={collectionsReport}
            isLoading={collectionsLoading}
            icon={Wallet}
            partyLabel="client"
            partyLabelPlural="Clients"
            columnLabel="Client"
            totalOutstandingLabel="Reste à recouvrer"
            emptyMessage="Aucune facture impayée pour le moment — le recouvrement est à jour."
            searchPlaceholder="Rechercher un client…"
          />
        </TabsContent>
        <TabsContent value="fournisseurs">
          <AgingReportView
            report={payablesReport}
            isLoading={payablesLoading}
            icon={Truck}
            partyLabel="fournisseur"
            partyLabelPlural="Fournisseurs"
            columnLabel="Fournisseur"
            totalOutstandingLabel="Reste à payer"
            emptyMessage="Aucune facture fournisseur impayée pour le moment — tout est réglé."
            searchPlaceholder="Rechercher un fournisseur…"
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
