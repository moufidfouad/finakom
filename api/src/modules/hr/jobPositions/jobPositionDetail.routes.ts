import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import {
  deleteJobPositionHandler,
  updateJobPositionHandler,
} from "./jobPositions.controller";

const router = Router();
router.use(requireAuth);
router.put("/:id", updateJobPositionHandler);
router.delete("/:id", deleteJobPositionHandler);
export default router;
