import { Router } from "express";
import { clickNotificationHandler } from "./candidateNotifications.controller";

const router = Router();
router.get("/:notificationId/click", clickNotificationHandler);
export default router;
