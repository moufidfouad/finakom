import { Router } from "express";
import { getFixedAssetDashboardHandler } from "./dashboard.controller";
import { postAnnualDepreciationHandler } from "./postDepreciation.controller";

const router = Router({ mergeParams: true });
router.get("/", getFixedAssetDashboardHandler);
router.post("/post-depreciation", postAnnualDepreciationHandler);
export default router;
