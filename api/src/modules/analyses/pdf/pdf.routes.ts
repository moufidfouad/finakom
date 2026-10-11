import { Router } from "express";
import { getFinancialStatementsPdfHandler } from "./pdf.controller";

const router = Router({ mergeParams: true });
router.get("/pdf", getFinancialStatementsPdfHandler);
export default router;
