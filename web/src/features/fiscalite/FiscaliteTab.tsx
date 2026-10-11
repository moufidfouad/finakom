import { Calendar, Landmark, Receipt, Users2, Wallet } from "lucide-react";
import { useFiscalRecap, useFiscalCalendar } from "./fiscalite.api";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import VatTab from "./VatTab";
import CorporateTaxTab from "./CorporateTaxTab";
import BusinessLicenseTab from "./BusinessLicenseTab";
import PayrollTaxTab from "./PayrollTaxTab";
import TaxSettingsTab from "./TaxSettingsTab";

/**
 * Point d'entrée du module fiscalité — sous-onglets internes, même patron
 * que TreasuryTab. Le récapitulatif est la vue par défaut : c'est la
 * synthèse la plus immédiatement utile (combien dois-je, au total, cette
 * année), pas un formulaire de saisie.
 */
export default function FiscaliteTab({ companyId }: { companyId: string }) {
  const fiscalYear = new Date().getFullYear();

  return (
    <div>
      <Tabs defaultValue="recap">
        <TabsList>
          <TabsTrigger value="recap">Récapitulatif</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
          <TabsTrigger value="vat">TVA</TabsTrigger>
          <TabsTrigger value="is">IS</TabsTrigger>
          <TabsTrigger value="patente">Patente</TabsTrigger>
          <TabsTrigger value="cnps-ir">CNPS & IR</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="recap">
          <RecapTab companyId={companyId} fiscalYear={fiscalYear} />
        </TabsContent>
        <TabsContent value="calendar">
          <CalendarTab companyId={companyId} fiscalYear={fiscalYear} />
        </TabsContent>
        <TabsContent value="vat">
          <VatTab companyId={companyId} fiscalYear={fiscalYear} />
        </TabsContent>
        <TabsContent value="is">
          <CorporateTaxTab companyId={companyId} fiscalYear={fiscalYear} />
        </TabsContent>
        <TabsContent value="patente">
          <BusinessLicenseTab companyId={companyId} fiscalYear={fiscalYear} />
        </TabsContent>
        <TabsContent value="cnps-ir">
          <PayrollTaxTab companyId={companyId} fiscalYear={fiscalYear} />
        </TabsContent>
        <TabsContent value="settings">
          <TaxSettingsTab companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RecapTab({
  companyId,
  fiscalYear,
}: {
  companyId: string;
  fiscalYear: number;
}) {
  const formatAmount = useFormatAmount();
  const { data: recap, isLoading } = useFiscalRecap(companyId, fiscalYear);

  if (isLoading || !recap) return <LoadingState />;

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Total impôts & taxes"
          value={formatAmount(recap.totalTaxesAndDues)}
        />
        <StatCard
          icon={Receipt}
          label="Taux de pression fiscale"
          value={`${(recap.taxPressureRate * 100).toFixed(1)}%`}
        />
        <StatCard icon={Landmark} label="Exercice" value={String(recap.year)} />
        <StatCard
          icon={Users2}
          label="Lignes de charges"
          value={String(recap.lines.length)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détail par impôt et taxe</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Impôt / taxe</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Montant dû</TableHead>
                <TableHead>Référence légale</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recap.lines.map((line) => (
                <TableRow key={line.taxType}>
                  <TableCell className="font-medium">{line.taxType}</TableCell>
                  <TableCell className="text-right tabular">
                    {line.base > 0 ? formatAmount(line.base) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular">
                    {formatAmount(line.amountDue)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {line.legalReference}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function CalendarTab({
  companyId,
  fiscalYear,
}: {
  companyId: string;
  fiscalYear: number;
}) {
  const formatAmount = useFormatAmount();
  const { data: deadlines, isLoading } = useFiscalCalendar(
    companyId,
    fiscalYear,
  );

  if (isLoading || !deadlines) return <LoadingState />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Échéances de l'exercice {fiscalYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mois</TableHead>
              <TableHead>Obligation</TableHead>
              <TableHead>Date limite</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Référence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deadlines.map((d, i) => (
              <TableRow key={i}>
                <TableCell>{d.month}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="mr-2">
                    {d.taxType}
                  </Badge>
                  {d.description}
                </TableCell>
                <TableCell>{d.dueDate}</TableCell>
                <TableCell className="text-right tabular">
                  {d.amount > 0 ? formatAmount(d.amount) : "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {d.legalReference}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
