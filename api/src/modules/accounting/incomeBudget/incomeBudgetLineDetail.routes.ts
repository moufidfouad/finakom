import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { deleteIncomeBudgetLineHandler } from "./incomeBudget.controller";

const router = Router();
router.use(requireAuth);
router.delete("/:id", deleteIncomeBudgetLineHandler);
export default router;
