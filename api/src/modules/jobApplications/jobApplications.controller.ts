import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { requireAuthContext } from "@/utils/authContext";
import {
  createJobApplicationSchema,
  updateJobApplicationStatusSchema,
} from "./jobApplications.schemas";
import * as jobApplicationsService from "./jobApplications.service";

// ---------- Espace candidat ----------

export const createJobApplicationHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    const input = createJobApplicationSchema.parse(req.body);
    res
      .status(201)
      .json(
        await jobApplicationsService.createJobApplication(
          req.params.jobPostingId,
          req.candidate.candidateId,
          input,
        ),
      );
  },
);

export const listCandidateApplicationsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.candidate) throw AppError.unauthorized();
    res.json(
      await jobApplicationsService.listCandidateApplications(
        req.candidate.candidateId,
      ),
    );
  },
);

// ---------- Espace entreprise ----------

export const listApplicationsForJobPostingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await jobApplicationsService.listApplicationsForJobPosting(
        req.params.jobPostingId,
        requireAuthContext(req),
      ),
    );
  },
);

export const updateJobApplicationStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateJobApplicationStatusSchema.parse(req.body);
    res.json(
      await jobApplicationsService.updateJobApplicationStatus(
        req.params.applicationId,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
