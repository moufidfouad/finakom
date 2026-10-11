import { Router } from "express";
import { getIncomeBudgetComparisonHandler } from "./incomeBudget.controller";

const router = Router({ mergeParams: true });
router.get("/", getIncomeBudgetComparisonHandler);
export default router;
