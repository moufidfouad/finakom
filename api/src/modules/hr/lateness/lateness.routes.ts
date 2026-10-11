import { Router } from "express";
import {
  createLatenessHandler,
  deleteLatenessHandler,
  listLatenessHandler,
} from "./lateness.controller";
const router = Router({ mergeParams: true });
router.get("/", listLatenessHandler);
router.post("/", createLatenessHandler);
router.delete("/:recordId", deleteLatenessHandler);
export default router;
