import { Request, Response } from "express";
import multer from "multer";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { requireAuthContext } from "@/utils/authContext";
import { deleteCompanyLogo, uploadCompanyLogo } from "./logo.service";

export const uploadLogoMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo
}).single("logo");

export const uploadCompanyLogoHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file)
      throw AppError.badRequest('Aucun fichier reçu (champ attendu : "logo").');
    const company = await uploadCompanyLogo(
      req.params.companyId,
      requireAuthContext(req),
      req.file,
    );
    res.status(200).json(company);
  },
);

export const deleteCompanyLogoHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const company = await deleteCompanyLogo(
      req.params.companyId,
      requireAuthContext(req),
    );
    res.status(200).json(company);
  },
);
