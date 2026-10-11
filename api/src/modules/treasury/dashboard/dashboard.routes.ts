import { Router } from "express";
import { getTreasuryDashboardHandler } from "./dashboard.controller";

const router = Router({ mergeParams: true });
router.get("/", getTreasuryDashboardHandler);
export default router;
