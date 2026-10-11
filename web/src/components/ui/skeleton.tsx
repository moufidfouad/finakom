import { cn } from '@/lib/utils';

/** Brique de base — un rectangle qui pulse doucement. Pour un squelette de
 * chargement complet (tableau ou grille de cartes), voir LoadingState plutôt
 * que de composer celui-ci à la main. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}
