import { Wallet, TrendingUp, Users, Building2 } from "lucide-react";
import { useGroupDashboard } from "./groupDashboard.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/lib/format";

/**
 * Tableau de bord "groupe" — agrège les indicateurs clés des entreprises
 * possédées par l'utilisateur. Regroupé PAR DEVISE (jamais une somme globale
 * unique, puisque les entreprises n'ont aucune garantie de partager la même
 * devise) : chaque groupe de devise affiche son propre total, indépendamment
 * des autres. Ne se substitue pas à une consolidation comptable réelle.
 */
export default function GroupDashboardCard() {
  const { data } = useGroupDashboard();

  if (!data || data.companyCount < 2) return null; // pas de valeur ajoutée pour une seule entreprise

  return (
    <div className="mb-8">
      <h2 className="mb-3 font-display text-lg font-medium text-foreground">
        Vue groupe
      </h2>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${Math.min(data.currencyGroups.length, 2)}, minmax(0, 1fr))`,
        }}
      >
        {data.currencyGroups.map((group) => (
          <Card key={group.currency}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Trésorerie et activité — {group.currency}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {group.companies.length} entreprise(s)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wallet className="h-3 w-3" /> Trésorerie
                  </p>
                  <p className="tabular mt-1 text-lg font-medium">
                    {formatAmount(group.totalCashBalance, group.currency)}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" /> CA (année)
                  </p>
                  <p className="tabular mt-1 text-lg font-medium">
                    {formatAmount(group.totalRevenueYTD, group.currency)}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> Effectif
                  </p>
                  <p className="tabular mt-1 text-lg font-medium">
                    {group.totalActiveEmployeeCount}
                  </p>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-border border-t border-border">
                {group.companies.map((c) => (
                  <li
                    key={c.companyId}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" /> {c.companyName}
                    </span>
                    <span className="tabular">
                      {formatAmount(c.cashBalance, c.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Regroupement des chiffres par entreprise — ne constitue pas une
        consolidation comptable (pas d'élimination des flux entre entreprises).
      </p>
    </div>
  );
}
