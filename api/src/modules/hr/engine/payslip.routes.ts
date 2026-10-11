import { Router } from "express";
import { getPayslipHandler } from "./payslip.controller";
const router = Router({ mergeParams: true });
router.get("/payslip", getPayslipHandler);
export default router;
