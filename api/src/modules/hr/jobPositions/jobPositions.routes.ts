import { Router } from "express";
import {
  createJobPositionHandler,
  listJobPositionsHandler,
} from "./jobPositions.controller";

const router = Router({ mergeParams: true });
router.get("/", listJobPositionsHandler);
router.post("/", createJobPositionHandler);
export default router;
