import { Router } from "express";
import {
  createAttendanceHandler,
  deleteAttendanceHandler,
  listAttendanceHandler,
} from "./attendance.controller";
const router = Router({ mergeParams: true });
router.get("/", listAttendanceHandler);
router.post("/", createAttendanceHandler);
router.delete("/:recordId", deleteAttendanceHandler);
export default router;
