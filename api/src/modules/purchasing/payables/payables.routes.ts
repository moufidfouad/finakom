import { Router } from 'express';
import { getPayablesReportHandler } from './payables.controller';

const router = Router({ mergeParams: true });
router.get('/', getPayablesReportHandler);
export default router;
