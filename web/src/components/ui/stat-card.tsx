import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  /** Variation par rapport à une période de référence — UNIQUEMENT si le
   * calcul source distingue déjà deux périodes comparables (ex: le module
   * Analyse financière compare N à N-1 sur une balance comptable réelle).
   * Ne jamais fabriquer une comparaison à partir de données qui n'en portent
   * pas nativement — un dashboard qui compare des totaux cumulés depuis
   * toujours n'a rien à comparer, et inventer un pourcentage serait trompeur. */
  trend?: { value: number; label?: string };
  className?: string;
}

/**
 * Carte de statistique standardisée — remplace les variantes locales de
 * "Stat" jusqu'ici dupliquées à la main dans plusieurs tableaux de bord,
 * toutes légèrement différentes (avec ou sans icône, avec ou sans sous-texte).
 */
export function StatCard({ icon: Icon, label, value, sub, trend, className }: StatCardProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="tabular mt-0.5 text-lg font-medium text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        {trend && (
          <p className={cn('mt-0.5 flex items-center gap-1 text-xs font-medium', trend.value >= 0 ? 'text-success' : 'text-destructive')}>
            {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
