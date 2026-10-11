import { Router } from "express";
import { rateLimit } from "@/middlewares/rateLimit";
import {
  contactCandidateHandler,
  getPublicCvFacetsHandler,
  getPublicCvHandler,
  listPublicCvsHandler,
} from "./publicCandidates.controller";

const router = Router();

router.get("/", listPublicCvsHandler);
router.get("/facets", getPublicCvFacetsHandler);
router.get("/:cvId", getPublicCvHandler);
router.post(
  "/:cvId/contact",
  rateLimit(5, 10 * 60 * 1000),
  contactCandidateHandler,
);

export default router;
