import { Mail, MapPin, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import ContactForm from "@/features/contact/ContactForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function ContactPage() {
  usePageMeta({
    title: "Contact — FINAKOM",
    description:
      "Une question sur FINAKOM ? Recruteurs, candidats, cabinets comptables — écrivez-nous, nous répondons personnellement à chaque message.",
    path: "/contact",
  });
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      {/* Grille de grand livre en filigrane — cohérente avec le hero de
          l'accueil et AuthLayout, pour une identité visuelle continue entre
          toutes les pages publiques. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "64px 32px",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <Badge variant="outline" className="mb-4">
              Contact
            </Badge>
            <h1 className="font-display text-3xl font-medium leading-tight text-foreground sm:text-4xl">
              Une question, une suggestion ?
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
              Que vous soyez cabinet comptable, DAF, gestionnaire RH, ou
              candidat à la recherche d'un poste, dites-nous ce que vous
              cherchez — nous répondons personnellement à chaque message.
            </p>

            <div className="mt-10 space-y-4">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Email
                    </p>
                    <p className="text-sm text-foreground">
                      contact@finakom.app
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Origine
                    </p>
                    <p className="text-sm text-foreground">
                      Comores (Océan Indien) — au service de tout l'espace OHADA
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Conformité
                    </p>
                    <p className="text-sm text-foreground">
                      Référentiel SYSCOHADA révisé
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1] as const,
            }}
          >
            <Card>
              <CardContent className="p-6 sm:p-8">
                <ContactForm />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
