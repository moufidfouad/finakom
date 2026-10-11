import { Router } from "express";
import {
  listApplicationsForJobPostingHandler,
  updateJobApplicationStatusHandler,
} from "./jobApplications.controller";

// Monté sous /companies/:companyId/job-postings/:jobPostingId/applications
const listRouter = Router({ mergeParams: true });
listRouter.get("/", listApplicationsForJobPostingHandler);

// Monté sous /companies/:companyId/job-applications
const statusRouter = Router({ mergeParams: true });
statusRouter.patch("/:applicationId/status", updateJobApplicationStatusHandler);

export { listRouter, statusRouter };
