import { Router } from "express";
import {
  deletePayrollHandler,
  listPayrollHandler,
  upsertPayrollHandler,
} from "./payroll.controller";
const router = Router({ mergeParams: true });
router.get("/", listPayrollHandler);
router.post("/", upsertPayrollHandler);
router.delete("/:recordId", deletePayrollHandler);
export default router;
