import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  deleteEmployeeHandler,
  getEmployeeHandler,
  getLeaveBalanceHandler,
  updateEmployeeHandler,
} from "./employees.controller";
import attendanceRouter from "@/modules/hr/attendance/attendance.routes";
import latenessRouter from "@/modules/hr/lateness/lateness.routes";
import workedHoursRouter from "@/modules/hr/workedHours/workedHours.routes";
import payrollRouter from "@/modules/hr/payroll/payroll.routes";
import leaveRouter from "@/modules/hr/leave/leave.routes";
import payslipRouter from "@/modules/hr/engine/payslip.routes";
import payslipPdfRouter from "@/modules/hr/engine/pdf/payslip.pdf.routes";
import contractPdfRouter from "@/modules/hr/engine/pdf/contract.pdf.routes";
import contractAmendmentsRouter from "@/modules/hr/contractAmendments/contractAmendments.routes";

const router = Router();
router.use(requireAuth);
router.get("/:id", getEmployeeHandler);
router.get("/:id/leave-balance", getLeaveBalanceHandler);
router.put("/:id", updateEmployeeHandler);
router.delete("/:id", deleteEmployeeHandler);
router.use("/:employeeId/attendance", attendanceRouter);
router.use("/:employeeId/lateness", latenessRouter);
router.use("/:employeeId/worked-hours", workedHoursRouter);
router.use("/:employeeId/payroll", payrollRouter);
router.use("/:employeeId/leave", leaveRouter);
router.use("/:employeeId/contract-amendments", contractAmendmentsRouter);
router.use("/:id", payslipRouter);
router.use("/:id", payslipPdfRouter);
router.use("/:id", contractPdfRouter);
export default router;
