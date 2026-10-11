import { Router } from "express";
import {
  listIncomeBudgetLinesHandler,
  upsertIncomeBudgetLineHandler,
} from "./incomeBudget.controller";

const router = Router({ mergeParams: true });
router.get("/", listIncomeBudgetLinesHandler);
router.post("/", upsertIncomeBudgetLineHandler);
export default router;
