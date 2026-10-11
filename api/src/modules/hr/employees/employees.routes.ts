import { Router } from "express";
import {
  createEmployeeHandler,
  exportEmployeesCsvHandler,
  getOrgChartHandler,
  listEmployeesHandler,
} from "./employees.controller";

const router = Router({ mergeParams: true });
router.get("/", listEmployeesHandler);
router.get("/export.csv", exportEmployeesCsvHandler);
router.get("/org-chart", getOrgChartHandler);
router.post("/", createEmployeeHandler);
export default router;
