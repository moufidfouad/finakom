import { Router } from "express";
import {
  createAnalysisHandler,
  listAnalysesHandler,
} from "./analyses.controller";

const router = Router({ mergeParams: true });

router.get("/", listAnalysesHandler);
router.post("/", createAnalysisHandler);

export default router;
