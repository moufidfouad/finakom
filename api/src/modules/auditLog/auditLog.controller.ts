import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { listAuditLogs } from "./auditLog.service";

export const listAuditLogsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { entityType, entityId, limit } = req.query as {
      entityType?: string;
      entityId?: string;
      limit?: string;
    };
    res.json(
      await listAuditLogs(req.params.companyId, requireAuthContext(req), {
        entityType,
        entityId,
        limit: limit ? Number(limit) : undefined,
      }),
    );
  },
);
