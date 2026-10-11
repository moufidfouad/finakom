import { Router } from "express";
import {
  listCompanyNotificationsHandler,
  markCompanyNotificationReadHandler,
} from "./companyNotifications.controller";

const router = Router({ mergeParams: true });

router.get("/", listCompanyNotificationsHandler);
router.patch("/:notificationId/read", markCompanyNotificationReadHandler);

export default router;
