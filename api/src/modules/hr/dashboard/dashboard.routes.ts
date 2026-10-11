import { Router } from "express";
import { getHrDashboardHandler } from "./dashboard.controller";
const router = Router({ mergeParams: true });
router.get("/", getHrDashboardHandler);
export default router;
