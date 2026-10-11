import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { listReportsQuerySchema } from "./adminConversationReports.schemas";
import * as adminConversationReportsService from "./adminConversationReports.service";

export const listReportsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listReportsQuerySchema.parse(req.query);
    res.json(await adminConversationReportsService.listReports(query));
  },
);

export const getReportDetailHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await adminConversationReportsService.getReportDetail(req.params.id),
    );
  },
);

export const resolveReportHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await adminConversationReportsService.resolveReport(req.params.id),
    );
  },
);
