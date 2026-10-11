import { Request, Response } from 'express';
import multer from 'multer';
import { asyncHandler } from '@/utils/asyncHandler';
import { AppError } from '@/utils/AppError';
import { deleteCandidatePhoto, uploadCandidatePhoto } from './photo.service';

export const uploadPhotoMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo
}).single('photo');

function requireCandidateId(req: Request): string {
  if (!req.candidate) throw AppError.unauthorized();
  return req.candidate.candidateId;
}

export const uploadCandidatePhotoHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw AppError.badRequest('Aucun fichier reçu (champ attendu : "photo").');
  const candidate = await uploadCandidatePhoto(requireCandidateId(req), req.file);
  res.status(200).json(candidate);
});

export const deleteCandidatePhotoHandler = asyncHandler(async (req: Request, res: Response) => {
  const candidate = await deleteCandidatePhoto(requireCandidateId(req));
  res.status(200).json(candidate);
});
