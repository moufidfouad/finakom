import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { requireAuthContext } from '@/utils/authContext';
import { getPayablesReport } from './payables.service';

export const getPayablesReportHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await getPayablesReport(req.params.companyId, requireAuthContext(req)));
});
