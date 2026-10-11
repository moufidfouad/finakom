import { Router } from "express";
import { listAuditLogsHandler } from "./auditLog.controller";

const router = Router({ mergeParams: true });
router.get("/", listAuditLogsHandler);
export default router;
