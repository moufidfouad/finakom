import { Router } from "express";
import {
  getPublicCvHandler,
  listPublicCvsHandler,
} from "./publicCvs.controller";

const router = Router();
router.get("/", listPublicCvsHandler);
router.get("/:cvId", getPublicCvHandler);
export default router;
