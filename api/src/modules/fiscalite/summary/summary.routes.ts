import { Router } from "express";
import {
  getFiscalCalendarHandler,
  getFiscalRecapHandler,
} from "./summary.controller";

const router = Router({ mergeParams: true });
router.get("/calendrier", getFiscalCalendarHandler);
router.get("/recapitulatif", getFiscalRecapHandler);
export default router;
