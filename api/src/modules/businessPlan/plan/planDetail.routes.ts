import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  deleteBusinessPlanHandler,
  getBusinessPlanHandler,
  updateBusinessPlanHandler,
} from "./plan.controller";
import investmentsRouter from "@/modules/businessPlan/investments/investments.routes";
import fundingsRouter from "@/modules/businessPlan/fundings/fundings.routes";
import suppliersRouter from "@/modules/businessPlan/suppliers/suppliers.routes";
import plLinesRouter from "@/modules/businessPlan/plLines/plLines.routes";
import cashflowRouter from "@/modules/businessPlan/cashflow/cashflow.routes";
import balanceRouter from "@/modules/businessPlan/balance/balance.routes";
import summaryRouter from "@/modules/businessPlan/summary/summary.routes";
import pdfRouter from "@/modules/businessPlan/pdf/pdf.routes";

const router = Router();
router.use(requireAuth);
router.get("/:id", getBusinessPlanHandler);
router.put("/:id", updateBusinessPlanHandler);
router.delete("/:id", deleteBusinessPlanHandler);
router.use("/:planId/investments", investmentsRouter);
router.use("/:planId/fundings", fundingsRouter);
router.use("/:planId/suppliers", suppliersRouter);
router.use("/:planId/pl-lines", plLinesRouter);
router.use("/:planId/cashflow-lines", cashflowRouter);
router.use("/:planId/balance-lines", balanceRouter);
router.use("/:planId/summary", summaryRouter);
router.use("/:id", pdfRouter);
export default router;
