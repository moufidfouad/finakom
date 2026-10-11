import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MonthlyBalance } from "@/types";
import { useFormatAmount } from "@/hooks/useFormatAmount";

const MONTH_LABELS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

/**
 * Évolution mensuelle d'un solde de trésorerie — réutilisable partout où
 * l'application calcule déjà un MonthlyBalance[] (prévision trésorerie sur 12
 * mois, plan de trésorerie du Business Plan) : même type de donnée, même
 * représentation. Aucune donnée n'est recalculée ici, uniquement affichée.
 */
export default function MonthlyBalanceChart({
  schedule,
}: {
  schedule: MonthlyBalance[];
}) {
  const formatAmount = useFormatAmount();
  const data = schedule.map((m) => ({
    month: MONTH_LABELS[(m.month - 1) % 12] ?? `M${m.month}`,
    solde: m.closingBalance,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="soldeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0.25}
            />
            <stop
              offset="95%"
              stopColor="hsl(var(--primary))"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(v)
          }
          width={48}
        />
        <Tooltip
          formatter={(value) => [
            formatAmount(Number(Array.isArray(value) ? value[0] : value)),
            "Solde",
          ]}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 13,
          }}
          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
        />
        <Area
          type="monotone"
          dataKey="solde"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#soldeGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
