import { Router } from "express";
import { requireCandidateAuth } from "@/middlewares/requireCandidateAuth";
import { createJobApplicationHandler } from "./jobApplications.controller";

const router = Router({ mergeParams: true });
router.post("/", requireCandidateAuth, createJobApplicationHandler);
export default router;
