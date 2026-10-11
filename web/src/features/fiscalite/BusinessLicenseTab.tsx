import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useBusinessLicense, useUpsertBusinessLicense } from "./fiscalite.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Landmark, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState } from "@/components/ui/loading-state";
import { useFormatAmount } from "@/hooks/useFormatAmount";

export default function BusinessLicenseTab({
  companyId,
  fiscalYear,
}: {
  companyId: string;
  fiscalYear: number;
}) {
  const formatAmount = useFormatAmount();
  const { data: license, isLoading } = useBusinessLicense(
    companyId,
    fiscalYear,
  );
  const upsert = useUpsertBusinessLicense(companyId, fiscalYear);
  const [revenue, setRevenue] = useState("");
  const [fixedDuty, setFixedDuty] = useState("");

  useEffect(() => {
    if (license) {
      setRevenue(String(license.annualRevenue));
      setFixedDuty(String(license.fixedDuty));
    }
  }, [license]);

  if (isLoading || !license) return <LoadingState />;

  function handleSave() {
    upsert.mutate({
      fiscalYear,
      annualRevenue: Number(revenue) || 0,
      fixedDuty: Number(fixedDuty) || 0,
      paid: license!.paid,
    });
  }

  return (
    <div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Wallet}
          label="Droit proportionnel"
          value={formatAmount(license.proportionalDuty)}
        />
        <StatCard
          icon={Landmark}
          label="Patente totale due"
          value={formatAmount(license.totalDue)}
        />
        <StatCard icon={Landmark} label="Échéance" value="31 mars" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Calcul de la patente — exercice {fiscalYear}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Chiffre d'affaires annuel HT</Label>
            <Input
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Droit fixe (selon catégorie ci-dessous)</Label>
            <Input
              type="number"
              value={fixedDuty}
              onChange={(e) => setFixedDuty(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        variant="accent"
        isLoading={upsert.isPending}
        onClick={handleSave}
        className="mb-6"
      >
        <Save className="h-4 w-4" /> Enregistrer
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Barème de référence par catégorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catégorie</TableHead>
                <TableHead>CA HT</TableHead>
                <TableHead>Droit fixe</TableHead>
                <TableHead>Taux propor.</TableHead>
                <TableHead>Activité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {license.brackets.map((b) => (
                <TableRow key={b.category}>
                  <TableCell className="font-medium">{b.category}</TableCell>
                  <TableCell>{b.revenueRange}</TableCell>
                  <TableCell>{formatAmount(b.fixedDuty)}</TableCell>
                  <TableCell>
                    {(b.proportionalRate * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {b.activity}
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
