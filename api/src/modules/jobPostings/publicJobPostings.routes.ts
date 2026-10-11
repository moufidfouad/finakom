import { Router } from "express";
import {
  getPublicJobPostingFacetsHandler,
  getPublicJobPostingHandler,
  listPublicJobPostingsHandler,
} from "./jobPostings.controller";

const router = Router();

router.get("/", listPublicJobPostingsHandler);
router.get("/facets", getPublicJobPostingFacetsHandler);
router.get("/:jobPostingId", getPublicJobPostingHandler);

export default router;
