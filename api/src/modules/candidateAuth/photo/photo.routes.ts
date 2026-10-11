import { Router } from 'express';
import { requireCandidateAuth } from '@/middlewares/requireCandidateAuth';
import { deleteCandidatePhotoHandler, uploadCandidatePhotoHandler, uploadPhotoMiddleware } from './photo.controller';

const router = Router();
router.use(requireCandidateAuth);
router.post('/', uploadPhotoMiddleware, uploadCandidatePhotoHandler);
router.delete('/', deleteCandidatePhotoHandler);
export default router;
