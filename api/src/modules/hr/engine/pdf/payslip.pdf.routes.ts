import { Router } from "express";
import { getPayslipPdfHandler } from "./payslip.pdf.controller";

const router = Router({ mergeParams: true });
router.get("/pdf", getPayslipPdfHandler);
export default router;
