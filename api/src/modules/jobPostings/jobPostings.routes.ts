import { Router } from "express";
import {
  createJobPostingHandler,
  deleteJobPostingHandler,
  getJobPostingForCompanyHandler,
  listJobPostingsForCompanyHandler,
  updateJobPostingHandler,
  updateJobPostingStatusHandler,
} from "./jobPostings.controller";

const router = Router({ mergeParams: true });

router.get("/", listJobPostingsForCompanyHandler);
router.post("/", createJobPostingHandler);
router.get("/:jobPostingId", getJobPostingForCompanyHandler);
router.put("/:jobPostingId", updateJobPostingHandler);
router.patch("/:jobPostingId/status", updateJobPostingStatusHandler);
router.delete("/:jobPostingId", deleteJobPostingHandler);

export default router;
