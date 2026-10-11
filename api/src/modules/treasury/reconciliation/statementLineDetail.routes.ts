import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  matchStatementLineHandler,
  unmatchStatementLineHandler,
} from "./reconciliation.controller";

const router = Router();
router.use(requireAuth);
router.post("/:id/match", matchStatementLineHandler);
router.delete("/:id/match", unmatchStatementLineHandler);
export default router;
