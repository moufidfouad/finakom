import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { requireSuperAdmin } from "@/middlewares/requireAdmin";
import { runAlertDigestsHandler } from "./notifications.controller";

const router = Router();
router.use(requireAuth, requireSuperAdmin);
router.post("/run", runAlertDigestsHandler);
export default router;
