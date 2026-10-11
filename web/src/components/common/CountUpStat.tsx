import { useEffect, useState } from "react";
import { motion, useReducedMotion, useInView, animate } from "framer-motion";
import { useRef } from "react";

interface CountUpStatProps {
  value: number;
  suffix?: string;
  label: string;
}

/** Un chiffre clé qui compte jusqu'à sa valeur au moment où il entre dans le
 * viewport — jamais rejoué une fois vu. */
export default function CountUpStat({
  value,
  suffix = "",
  label,
}: CountUpStatProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value]);

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5 }}
    >
      <p className="font-display text-2xl font-medium text-primary sm:text-3xl">
        {display}
        {suffix}
      </p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </motion.div>
  );
}
