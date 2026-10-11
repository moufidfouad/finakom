import { Router } from "express";
import {
  getVatYearSummaryHandler,
  upsertMonthlyVatReturnHandler,
} from "./vat.controller";

const router = Router({ mergeParams: true });
router.get("/", getVatYearSummaryHandler);
router.put("/", upsertMonthlyVatReturnHandler);
export default router;
