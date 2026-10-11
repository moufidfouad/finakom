import { Router } from "express";
import { getCollectionsReportHandler } from "./collections.controller";

const router = Router({ mergeParams: true });
router.get("/", getCollectionsReportHandler);
export default router;
