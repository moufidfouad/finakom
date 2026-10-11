import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PLYearResult } from "@/types";
import { useFormatAmount } from "@/hooks/useFormatAmount";

/**
 * Évolution du chiffre d'affaires et du résultat net par année — à partir du
 * compte de résultat prévisionnel déjà calculé par année du Business Plan
 * (profitLoss.byYear). Aucune donnée n'est recalculée ici, uniquement affichée.
 */
export default function YearlyResultChart({
  byYear,
}: {
  byYear: Record<string, PLYearResult>;
}) {
  const formatAmount = useFormatAmount();
  const data = Object.entries(byYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, r]) => ({
      year: `Année ${year}`,
      "Chiffre d'affaires": r.chiffreAffaires,
      "Résultat net": r.resultatNet,
    }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis
          dataKey="year"
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
          formatter={(value) =>
            formatAmount(Number(Array.isArray(value) ? value[0] : value))
          }
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 13,
          }}
          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar
          dataKey="Chiffre d'affaires"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="Résultat net"
          fill="hsl(var(--accent))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
