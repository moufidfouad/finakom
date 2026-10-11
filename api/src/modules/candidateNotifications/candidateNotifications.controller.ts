import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { env } from "@/config/env";
import * as candidateNotificationsService from "./candidateNotifications.service";

export const listCandidateNotificationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    res.json(
      await candidateNotificationsService.listCandidateNotifications(
        req.candidate.candidateId,
      ),
    );
  },
);

export const markNotificationReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    await candidateNotificationsService.markNotificationRead(
      req.params.notificationId,
    );
    res.json({ success: true });
  },
);

export const markContactNotificationReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    await candidateNotificationsService.markContactNotificationRead(
      req.params.notificationId,
    );
    res.json({ success: true });
  },
);

/**
 * Endpoint PUBLIC (pas d'authentification) — cliqué depuis un client email,
 * qui ne porte jamais les cookies de session du navigateur. L'identifiant de
 * notification (UUID v4, impossible à deviner) sert d'autorisation implicite
 * pour cette action à faible risque (marquer "lu", rien de sensible) — même
 * principe que le tracking de clic de n'importe quel email marketing.
 */
export const clickNotificationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { jobPostingId } =
      await candidateNotificationsService.markNotificationRead(
        req.params.notificationId,
      );
    res.redirect(`${env.FRONTEND_URL}/offres/${jobPostingId}`);
  },
);
