import { Router } from "express";
import {
  createBusinessPlanHandler,
  listBusinessPlansHandler,
} from "./plan.controller";

const router = Router({ mergeParams: true });
router.get("/", listBusinessPlansHandler);
router.post("/", createBusinessPlanHandler);
export default router;
