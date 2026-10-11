import { Router } from "express";
import {
  createBalanceLineHandler,
  deleteBalanceLineHandler,
  listBalanceLinesHandler,
  updateBalanceLineHandler,
} from "./balance.controller";

const router = Router({ mergeParams: true });
router.get("/", listBalanceLinesHandler);
router.post("/", createBalanceLineHandler);
router.put("/:id", updateBalanceLineHandler);
router.delete("/:id", deleteBalanceLineHandler);
export default router;
