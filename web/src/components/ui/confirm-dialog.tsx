import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  /** 'destructive' (défaut) pour une suppression, 'accent' pour une action
   * sensible mais non destructive (ex: clôturer un exercice). */
  variant?: 'destructive' | 'accent';
}

/**
 * Confirmation standardisée pour une action sensible — synthétise un patron
 * jusqu'ici dupliqué à l'identique dans 9 fichiers différents (suppression de
 * client, produit, fournisseur, immobilisation, mouvement de trésorerie,
 * business plan, document, employé...).
 */
export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = 'Confirmer', cancelLabel = 'Annuler',
  isLoading = false, onConfirm, variant = 'destructive',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="text-sm text-muted-foreground">{description}</div>
        <div className="mt-4 flex items-center gap-3">
          <Button variant={variant} isLoading={isLoading} onClick={onConfirm}>{confirmLabel}</Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
