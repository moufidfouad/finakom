import { Router } from "express";
import {
  getPublicCompanyFacetsHandler,
  getPublicCompanyHandler,
  listPublicCompaniesHandler,
} from "./publicCompanies.controller";

const router = Router();

router.get("/", listPublicCompaniesHandler);
router.get("/facets", getPublicCompanyFacetsHandler);
router.get("/:companyId", getPublicCompanyHandler);

export default router;
