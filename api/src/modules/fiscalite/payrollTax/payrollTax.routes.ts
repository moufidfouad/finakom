import { Router } from "express";
import {
  getPayrollTaxYearSummaryHandler,
  upsertMonthlyPayrollTaxHandler,
} from "./payrollTax.controller";

const router = Router({ mergeParams: true });
router.get("/", getPayrollTaxYearSummaryHandler);
router.put("/", upsertMonthlyPayrollTaxHandler);
export default router;
