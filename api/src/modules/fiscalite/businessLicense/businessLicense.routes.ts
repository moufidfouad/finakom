import { Router } from "express";
import {
  getBusinessLicenseSummaryHandler,
  upsertBusinessLicenseReturnHandler,
} from "./businessLicense.controller";

const router = Router({ mergeParams: true });
router.get("/", getBusinessLicenseSummaryHandler);
router.put("/", upsertBusinessLicenseReturnHandler);
export default router;
