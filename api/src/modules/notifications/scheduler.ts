import cron from "node-cron";
import { runAllCompaniesAlertDigests } from "./notifications.service";
import { runAllCandidatesNotificationDigests } from "@/modules/candidateNotifications/candidateNotifications.service";

/**
 * Planificateur en mémoire du processus serveur — s'exécute chaque jour à
 * 07h00 (heure du serveur) et vérifie automatiquement toutes les entreprises
 * de la plateforme, sans intervention manuelle. Complémentaire, pas exclusif,
 * de l'endpoint de déclenchement manuel (`POST /notifications/run`) : certains
 * hébergements ne garantissent pas un processus Node persistant 24h/24 (ex:
 * serverless), auquel cas un cron externe appelant cet endpoint reste nécessaire —
 * ce planificateur interne couvre le cas courant d'un serveur qui tourne en continu.
 */
export function startNotificationScheduler(): void {
  cron.schedule("36 23 * * *", async () => {
    console.log("🔔 Vérification quotidienne des alertes — démarrage");
    try {
      const results = await runAllCompaniesAlertDigests();
      console.log(
        `🔔 Vérification terminée — ${results.length} entreprise(s) notifiée(s).`,
      );
    } catch (err) {
      console.error(
        "❌ Échec de la vérification quotidienne des alertes :",
        err,
      );
    }

    // Même exécution quotidienne, mais isolée dans son propre try/catch :
    // un échec du digest candidat ne doit jamais empêcher le digest
    // entreprise (déjà exécuté ci-dessus) de s'être terminé normalement.
    console.log("🔔 Digest quotidien des notifications candidates — démarrage");
    try {
      const results = await runAllCandidatesNotificationDigests();
      console.log(
        `🔔 Digest terminé — ${results.length} candidat(s) notifié(s).`,
      );
    } catch (err) {
      console.error(
        "❌ Échec du digest quotidien des notifications candidates :",
        err,
      );
    }
  });
  console.log("🔔 Planificateur de notifications démarré (quotidien, 07h00).");
}
