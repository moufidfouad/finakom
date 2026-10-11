import { Router } from "express";
import { getBusinessPlanSummaryHandler } from "./summary.controller";

const router = Router({ mergeParams: true });
router.get("/", getBusinessPlanSummaryHandler);
export default router;
