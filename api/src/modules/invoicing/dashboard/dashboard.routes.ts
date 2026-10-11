import { Router } from "express";
import { getInvoicingDashboardHandler } from "./dashboard.controller";

const router = Router({ mergeParams: true });
router.get("/", getInvoicingDashboardHandler);
export default router;
