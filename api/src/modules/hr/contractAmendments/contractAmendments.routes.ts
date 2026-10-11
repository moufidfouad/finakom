import { Router } from "express";
import {
  createAmendmentHandler,
  listAmendmentsHandler,
} from "./contractAmendments.controller";

const router = Router({ mergeParams: true });
router.get("/", listAmendmentsHandler);
router.post("/", createAmendmentHandler);
export default router;
