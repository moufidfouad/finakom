import { Router } from "express";
import {
  createInvestmentHandler,
  deleteInvestmentHandler,
  listInvestmentsHandler,
  updateInvestmentHandler,
} from "./investments.controller";

const router = Router({ mergeParams: true });
router.get("/", listInvestmentsHandler);
router.post("/", createInvestmentHandler);
router.put("/:id", updateInvestmentHandler);
router.delete("/:id", deleteInvestmentHandler);
export default router;
