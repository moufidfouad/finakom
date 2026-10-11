import { cn } from '@/lib/utils';

/**
 * Squelette de chargement générique — remplace le texte brut "Chargement…"
 * (31 occurrences dupliquées) par une esquisse animée du contenu à venir,
 * pour une perception de rapidité même quand le chargement est bref. Variante
 * "table" par défaut (le cas le plus fréquent dans l'application) ; "card"
 * pour les tableaux de bord composés de cartes de statistiques.
 */
export function LoadingState({ variant = 'table', rows = 4 }: { variant?: 'table' | 'card'; rows?: number }) {
  if (variant === 'card') {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-6 w-28 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn('flex items-center gap-4 px-4 py-3', i > 0 && 'border-t border-border')}>
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
