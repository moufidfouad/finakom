import { Router } from "express";
import { rateLimit } from "@/middlewares/rateLimit";
import { submitContactCandidateHandler } from "./contactCandidate.controller";

const router = Router({ mergeParams: true });
router.post("/", rateLimit(5, 10 * 60 * 1000), submitContactCandidateHandler);
export default router;
