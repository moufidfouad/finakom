import { Router } from "express";
import {
  listBudgetLinesHandler,
  upsertBudgetLineHandler,
} from "./budget.controller";

const router = Router({ mergeParams: true });
router.get("/", listBudgetLinesHandler);
router.post("/", upsertBudgetLineHandler);
export default router;
