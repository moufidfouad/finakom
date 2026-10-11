import { Router } from "express";
import {
  createCashflowLineHandler,
  deleteCashflowLineHandler,
  listCashflowLinesHandler,
  updateCashflowLineHandler,
} from "./cashflow.controller";

const router = Router({ mergeParams: true });
router.get("/", listCashflowLinesHandler);
router.post("/", createCashflowLineHandler);
router.put("/:id", updateCashflowLineHandler);
router.delete("/:id", deleteCashflowLineHandler);
export default router;
