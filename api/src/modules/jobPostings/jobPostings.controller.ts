import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createJobPostingSchema,
  listPublicJobPostingsQuerySchema,
  updateJobPostingSchema,
  updateJobPostingStatusSchema,
} from "./jobPostings.schemas";
import * as jobPostingsService from "./jobPostings.service";

// ---------- Espace entreprise ----------

export const listJobPostingsForCompanyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await jobPostingsService.listJobPostingsForCompany(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);

export const getJobPostingForCompanyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await jobPostingsService.getJobPostingForCompany(
        req.params.jobPostingId,
        requireAuthContext(req),
      ),
    );
  },
);

export const createJobPostingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createJobPostingSchema.parse(req.body);
    res
      .status(201)
      .json(
        await jobPostingsService.createJobPosting(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);

export const updateJobPostingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateJobPostingSchema.parse(req.body);
    res.json(
      await jobPostingsService.updateJobPosting(
        req.params.jobPostingId,
        requireAuthContext(req),
        input,
      ),
    );
  },
);

export const updateJobPostingStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateJobPostingStatusSchema.parse(req.body);
    res.json(
      await jobPostingsService.updateJobPostingStatus(
        req.params.jobPostingId,
        requireAuthContext(req),
        input,
      ),
    );
  },
);

export const deleteJobPostingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await jobPostingsService.deleteJobPosting(
      req.params.jobPostingId,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);

// ---------- Espace public ----------

export const listPublicJobPostingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listPublicJobPostingsQuerySchema.parse(req.query);
    res.json(await jobPostingsService.listPublicJobPostings(query));
  },
);

export const getPublicJobPostingFacetsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    res.json(await jobPostingsService.getPublicJobPostingFacets());
  },
);

export const getPublicJobPostingHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await jobPostingsService.getPublicJobPosting(req.params.jobPostingId),
    );
  },
);
