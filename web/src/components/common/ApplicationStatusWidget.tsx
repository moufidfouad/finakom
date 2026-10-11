import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

const STEPS = ["Envoyée", "Vue par l'entreprise", "En cours d'étude"];

/**
 * Pendant candidat de BalanceCheckWidget 
 */
export default function ApplicationStatusWidget() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(reduceMotion ? STEPS.length - 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setStep(i), 500 + i * 700),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 16, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-70 rounded-xl border border-border bg-card p-5 shadow-[0_20px_50px_-15px_rgba(27,42,74,0.35)] sm:max-w-75"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Suivi de candidature
        </p>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
        </span>
      </div>

      <div className="space-y-3">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2.5">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${i <= step ? "bg-success text-success-foreground" : "border border-border"}`}
            >
              {i <= step && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
            </span>
            <span
              className={`text-[13px] ${i <= step ? "text-foreground" : "text-muted-foreground"}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[11px] leading-snug text-muted-foreground">
        Comptable senior — Bacar BTP SARL
      </p>
    </motion.div>
  );
}
