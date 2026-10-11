import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  /** 'card' (défaut) : grande carte avec icône, pour les listes principales
   * en pleine largeur. 'compact' : simple ligne de texte discrète, pour les
   * sections secondaires déjà denses (ex: liste des paiements dans le détail
   * d'une facture) où une grande carte serait disproportionnée. */
  variant?: 'card' | 'compact';
}

/**
 * État vide standardisé — synthétise un patron jusqu'ici dupliqué à la main
 * dans une vingtaine de fichiers (icône + carte en pointillé + message,
 * parfois un bouton d'action), avec des variations mineures d'un endroit à
 * l'autre. Toute évolution du style d'un état vide ne se fait donc plus qu'à
 * un seul endroit.
 */
export function EmptyState({ icon: Icon, title, message, actionLabel, onAction, className, variant = 'card' }: EmptyStateProps) {
  if (variant === 'compact') {
    return <p className={cn('text-sm text-muted-foreground', className)}>{message}</p>;
  }

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center py-12 text-center">
        {Icon && <Icon className="h-8 w-8 text-muted-foreground" />}
        {title && <p className="mt-3 text-sm font-medium text-foreground">{title}</p>}
        <p className={cn('text-sm text-muted-foreground', title ? 'mt-1' : 'mt-3')}>{message}</p>
        {actionLabel && onAction && (
          <Button variant="outline" size="sm" className="mt-4" onClick={onAction}>{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  );
}
