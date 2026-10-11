import { Router } from "express";
import {
  createLeaveHandler,
  deleteLeaveHandler,
  listLeaveHandler,
  updateLeaveStatusHandler,
} from "./leave.controller";
const router = Router({ mergeParams: true });
router.get("/", listLeaveHandler);
router.post("/", createLeaveHandler);
router.patch("/:recordId/status", updateLeaveStatusHandler);
router.delete("/:recordId", deleteLeaveHandler);
export default router;
