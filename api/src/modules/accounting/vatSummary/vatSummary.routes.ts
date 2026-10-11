import { Router } from "express";
import { getVatSummaryHandler } from "./vatSummary.controller";

const router = Router({ mergeParams: true });
router.get("/", getVatSummaryHandler);
export default router;
