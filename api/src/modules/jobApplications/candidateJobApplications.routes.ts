import { Router } from "express";
import { requireCandidateAuth } from "@/middlewares/requireCandidateAuth";
import { listCandidateApplicationsHandler } from "./jobApplications.controller";

const router = Router();
router.use(requireCandidateAuth);
router.get("/", listCandidateApplicationsHandler);
export default router;
