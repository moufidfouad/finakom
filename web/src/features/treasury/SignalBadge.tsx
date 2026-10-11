import { Badge } from "@/components/ui/badge";
import { TreasurySignal } from "@/types";

const SIGNAL_CONFIG: Record<
  TreasurySignal,
  { label: string; variant: "success" | "accent" | "destructive" }
> = {
  OK: { label: "✅ OK", variant: "success" },
  ALERTE: { label: "🟡 Alerte", variant: "accent" },
  CRITIQUE: { label: "🔴 Critique", variant: "destructive" },
};

export default function SignalBadge({ signal }: { signal: TreasurySignal }) {
  const config = SIGNAL_CONFIG[signal];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
