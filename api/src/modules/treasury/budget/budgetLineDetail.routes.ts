import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { deleteBudgetLineHandler } from "./budget.controller";

const router = Router();
router.use(requireAuth);
router.delete("/:id", deleteBudgetLineHandler);
export default router;
