import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Fait apparaître une section en fondu + légère translation au moment où
 * elle entre dans le viewport — jamais rejouée une fois vue (once: true),
 * pour ne pas ré-animer à chaque scroll de va-et-vient. Respecte
 * prefers-reduced-motion : dans ce cas, le contenu apparaît directement sans
 * transition, plutôt que de forcer un mouvement que la personne a choisi
 * d'éviter au niveau de son système.
 */
export default function AnimatedSection({
  children,
  className,
  delay = 0,
}: AnimatedSectionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
