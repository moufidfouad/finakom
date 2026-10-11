import { Router } from "express";
import { requireCandidateAuth } from "@/middlewares/requireCandidateAuth";
import {
  listCandidateNotificationsHandler,
  markContactNotificationReadHandler,
  markNotificationReadHandler,
} from "./candidateNotifications.controller";

const router = Router();
router.use(requireCandidateAuth);
router.get("/", listCandidateNotificationsHandler);
router.patch("/:notificationId/read", markNotificationReadHandler);
router.patch(
  "/contact/:notificationId/read",
  markContactNotificationReadHandler,
);
export default router;
