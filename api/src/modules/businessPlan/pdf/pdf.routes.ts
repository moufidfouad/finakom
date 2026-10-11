import { Router } from "express";
import { getBusinessPlanPdfHandler } from "./pdf.controller";

const router = Router({ mergeParams: true });
router.get("/pdf", getBusinessPlanPdfHandler);
export default router;
