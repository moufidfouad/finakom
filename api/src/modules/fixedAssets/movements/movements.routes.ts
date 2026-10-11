import { Router } from "express";
import {
  createMovementHandler,
  deleteMovementHandler,
  listMovementsHandler,
} from "./movements.controller";

const router = Router({ mergeParams: true });
router.get("/", listMovementsHandler);
router.post("/", createMovementHandler);
router.delete("/:movementId", deleteMovementHandler);
export default router;
