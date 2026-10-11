import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { getGroupDashboardHandler } from "./groupDashboard.controller";

const router = Router();
router.use(requireAuth);
router.get("/", getGroupDashboardHandler);
export default router;
