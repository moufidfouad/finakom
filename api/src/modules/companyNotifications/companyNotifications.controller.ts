import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import * as companyNotificationsService from "./companyNotifications.service";

export const listCompanyNotificationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await companyNotificationsService.listCompanyNotifications(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);

export const markCompanyNotificationReadHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await companyNotificationsService.markCompanyNotificationRead(
      req.params.notificationId,
      requireAuthContext(req),
    );
    res.json({ success: true });
  },
);
