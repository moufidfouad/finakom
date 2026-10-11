import { Router } from "express";
import {
  getCorporateTaxSummaryHandler,
  upsertCorporateTaxReturnHandler,
} from "./corporateTax.controller";

const router = Router({ mergeParams: true });
router.get("/", getCorporateTaxSummaryHandler);
router.put("/", upsertCorporateTaxReturnHandler);
export default router;
