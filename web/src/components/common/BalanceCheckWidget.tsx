import { useEffect, useState } from "react";
import { motion, useReducedMotion, animate } from "framer-motion";
import { Check } from "lucide-react";

function formatKmf(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })
    .format(Math.round(n))
    .replace(/[\u202F\u00A0]/g, " ");
}

/**
 * Élément signature du hero — pas un tableau de bord générique avec une
 * courbe qui monte, mais l'incarnation littérale de ce que FINAKOM vérifie
 * réellement à chaque écriture : que Débit et Crédit s'équilibrent. Les deux
 * montants montent en compte à rebours jusqu'à une valeur identique, l'écart
 * converge visuellement vers zéro, une coche confirme l'équilibre — le même
 * contrôle que celui visible dans les vrais PDF d'états financiers du produit.
 */
export default function BalanceCheckWidget() {
  const reduceMotion = useReducedMotion();
  const target = 4582150;
  const [debit, setDebit] = useState(reduceMotion ? target : 0);
  const [credit, setCredit] = useState(reduceMotion ? target : 0);
  const [settled, setSettled] = useState(reduceMotion ? true : false);

  useEffect(() => {
    if (reduceMotion) return;
    const controls1 = animate(0, target, {
      duration: 1.6,
      delay: 0.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setDebit,
    });
    const controls2 = animate(0, target, {
      duration: 1.6,
      delay: 0.55,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setCredit,
    });
    const timeout = setTimeout(() => setSettled(true), 2200);
    return () => {
      controls1.stop();
      controls2.stop();
      clearTimeout(timeout);
    };
  }, [reduceMotion]);

  const ecart = Math.abs(debit - credit);

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 16, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-70 rounded-xl border border-border bg-card p-5 shadow-[0_20px_50px_-15px_rgba(27,42,74,0.35)] sm:max-w-75"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Contrôle de cohérence
        </p>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
      </div>

      <div className="space-y-2.5 font-mono text-[13px] tabular-nums">
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground">Total débit</span>
          <span className="text-foreground">{formatKmf(debit)}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-muted-foreground">Total crédit</span>
          <span className="text-foreground">{formatKmf(credit)}</span>
        </div>
        <div className="my-1 border-t border-dashed border-border" />
        <div className="flex items-baseline justify-between">
          <span className="font-medium text-foreground">Écart</span>
          <span
            className={`flex items-center gap-1.5 font-medium ${ecart < 1 ? "text-success" : "text-accent"}`}
          >
            {formatKmf(ecart)}
            {settled && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="flex h-4 w-4 items-center justify-center rounded-full bg-success text-success-foreground"
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </motion.span>
            )}
          </span>
        </div>
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[11px] leading-snug text-muted-foreground">
        Balance équilibrée automatiquement à chaque écriture.
      </p>
    </motion.div>
  );
}
