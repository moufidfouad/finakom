import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { runAllCompaniesAlertDigests } from "./notifications.service";
import { runAllCandidatesNotificationDigests } from "@/modules/candidateNotifications/candidateNotifications.service";

/** Déclenchement manuel — réservé SUPERADMIN (voir requireSuperAdmin sur la
 * route). Utile pour tester, ou pour un cron externe (hébergement sans process
 * persistant) qui appellerait cet endpoint périodiquement plutôt que de
 * compter sur le planificateur interne. */
export const runAlertDigestsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const companyResults = await runAllCompaniesAlertDigests();
    const candidateResults = await runAllCandidatesNotificationDigests();
    res.json({
      companiesNotified: companyResults.length,
      companyResults,
      candidatesNotified: candidateResults.length,
      candidateResults,
    });
  },
);
