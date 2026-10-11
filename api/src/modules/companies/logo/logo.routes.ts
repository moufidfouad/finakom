import { Router } from "express";
import {
  deleteCompanyLogoHandler,
  uploadCompanyLogoHandler,
  uploadLogoMiddleware,
} from "./logo.controller";

const router = Router({ mergeParams: true });
router.post("/", uploadLogoMiddleware, uploadCompanyLogoHandler);
router.delete("/", deleteCompanyLogoHandler);
export default router;
