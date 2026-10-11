import { Router } from "express";
import { requireCandidateAuth } from "@/middlewares/requireCandidateAuth";
import {
  createCvHandler,
  deleteCvHandler,
  getCvHandler,
  listCvsHandler,
  updateCvHandler,
  updateCvVisibilityHandler,
} from "./cv.controller";
import { streamCvPdfHandler } from "./pdf/pdf.controller";

const router = Router();

router.use(requireCandidateAuth); // toutes les routes CV exigent une session candidate

router.get("/", listCvsHandler);
router.post("/", createCvHandler);
router.get("/:cvId", getCvHandler);
router.get("/:cvId/pdf", streamCvPdfHandler);
router.put("/:cvId", updateCvHandler);
router.patch("/:cvId/visibility", updateCvVisibilityHandler);
router.delete("/:cvId", deleteCvHandler);

export default router;
