import { Router } from "express";
import {
  deleteWorkedHoursHandler,
  listWorkedHoursHandler,
  upsertWorkedHoursHandler,
} from "./workedHours.controller";
const router = Router({ mergeParams: true });
router.get("/", listWorkedHoursHandler);
router.post("/", upsertWorkedHoursHandler);
router.delete("/:recordId", deleteWorkedHoursHandler);
export default router;
