import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { listPublicCompaniesQuerySchema } from "./publicCompanies.schemas";
import * as publicCompaniesService from "./publicCompanies.service";

export const listPublicCompaniesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listPublicCompaniesQuerySchema.parse(req.query);
    res.json(await publicCompaniesService.listPublicCompanies(query));
  },
);

export const getPublicCompanyFacetsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    res.json(await publicCompaniesService.getPublicCompanyFacets());
  },
);

export const getPublicCompanyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await publicCompaniesService.getPublicCompany(req.params.companyId),
    );
  },
);
