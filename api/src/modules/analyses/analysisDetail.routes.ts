import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  deleteAnalysisHandler,
  getAnalysisHandler,
  updateAnalysisHandler,
} from "./analyses.controller";
import balanceRouter from "@/modules/balance/balance.routes";
import resultsRouter from "@/modules/engine/results.routes";
import pdfRouter from "@/modules/analyses/pdf/pdf.routes";

const router = Router();

router.use(requireAuth);

router.get("/:id", getAnalysisHandler);
router.put("/:id", updateAnalysisHandler);
router.delete("/:id", deleteAnalysisHandler);

router.use("/:id/balance", balanceRouter);
router.use("/:id", resultsRouter);
router.use("/:id", pdfRouter);

export default router;
