import {
  FileText,
  CheckCircle2,
  Percent,
  Receipt,
  Wallet,
  Landmark,
  Calculator,
  HandCoins,
  AlertTriangle,
  PieChart,
  Users,
  Package,
  XCircle,
} from "lucide-react";
import { useInvoicingDashboard } from "./invoicingDashboard.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { LoadingState } from "@/components/ui/loading-state";

export default function InvoicingDashboardTab({
  companyId,
}: {
  companyId: string;
}) {
  const formatAmount = useFormatAmount();
  const { data, isLoading, isError } = useInvoicingDashboard(companyId);

  if (isLoading) return <LoadingState variant="card" />;
  if (isError || !data)
    return (
      <p className="text-sm text-destructive">
        Impossible de charger le tableau de bord.
      </p>
    );

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activité commerciale</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatCard
            icon={FileText}
            label="Devis émis"
            value={String(data.activite.devisEmis)}
          />
          <StatCard
            icon={CheckCircle2}
            label="Devis acceptés"
            value={String(data.activite.devisAcceptes)}
          />
          <StatCard
            icon={Percent}
            label="Taux conversion"
            value={`${(data.activite.tauxConversionDevis * 100).toFixed(0)}%`}
          />
          <StatCard
            icon={Receipt}
            label="Factures émises"
            value={String(data.activite.facturesEmises)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chiffre d'affaires</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatCard
            icon={Wallet}
            label="CA facturé TTC"
            value={formatAmount(data.chiffreAffaires.caFactureTTC)}
          />
          <StatCard
            icon={Landmark}
            label="TVA collectée"
            value={formatAmount(data.chiffreAffaires.tvaCollectee)}
          />
          <StatCard
            icon={Calculator}
            label="Facture moyenne"
            value={formatAmount(data.chiffreAffaires.factureMoyenneTTC)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Encaissements</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatCard
            icon={HandCoins}
            label="Encaissé"
            value={formatAmount(data.encaissements.encaisse)}
          />
          <StatCard
            icon={AlertTriangle}
            label="Reste à recouvrer"
            value={formatAmount(data.encaissements.resteARecouvrer)}
          />
          <StatCard
            icon={PieChart}
            label="Taux de recouvrement"
            value={`${(data.encaissements.tauxRecouvrement * 100).toFixed(0)}%`}
            sub={`${data.encaissements.facturesImpayees} impayée(s), ${data.encaissements.facturesPartielles} partielle(s)`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catalogue & stock</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatCard
            icon={Users}
            label="Clients"
            value={String(data.catalogue.clientsCount)}
          />
          <StatCard
            icon={Package}
            label="Articles"
            value={String(data.catalogue.articlesCount)}
          />
          <StatCard
            icon={XCircle}
            label="En rupture"
            value={String(data.stock.enRupture)}
          />
          <StatCard
            icon={AlertTriangle}
            label="Sous le seuil"
            value={String(data.stock.sousLeSeuil)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
