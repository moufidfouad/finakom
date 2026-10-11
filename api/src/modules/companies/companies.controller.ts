import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createCompanySchema, updateCompanySchema } from "./companies.schemas";
import { updateDirectorySettingsSchema } from "@/modules/publicCompanies/publicCompanies.schemas";
import * as companiesService from "./companies.service";

export const listCompaniesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const companies = await companiesService.listCompanies(auth);
    res.json(companies);
  },
);

export const createCompanyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const input = createCompanySchema.parse(req.body);
    const company = await companiesService.createCompany(auth.userId, input);
    res.status(201).json(company);
  },
);

export const getCompanyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const company = await companiesService.getCompany(req.params.id, auth);
    res.json(company);
  },
);

export const updateCompanyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const input = updateCompanySchema.parse(req.body);
    const company = await companiesService.updateCompany(
      req.params.id,
      auth,
      input,
    );
    res.json(company);
  },
);

export const updateDirectorySettingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const input = updateDirectorySettingsSchema.parse(req.body);
    const company = await companiesService.updateDirectorySettings(
      req.params.id,
      auth,
      input,
    );
    res.json(company);
  },
);

export const deleteCompanyHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    await companiesService.deleteCompany(req.params.id, auth);
    res.status(204).send();
  },
);
