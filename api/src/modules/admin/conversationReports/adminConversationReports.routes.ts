import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth";
import { requireSuperAdmin } from "@/middlewares/requireAdmin";
import {
  getReportDetailHandler,
  listReportsHandler,
  resolveReportHandler,
} from "./adminConversationReports.controller";

const router = Router();
router.use(requireAuth, requireSuperAdmin);
router.get("/", listReportsHandler);
router.get("/:id", getReportDetailHandler);
router.patch("/:id/resolve", resolveReportHandler);
export default router;
