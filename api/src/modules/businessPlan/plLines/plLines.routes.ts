import { Router } from "express";
import {
  createPLLineHandler,
  deletePLLineHandler,
  listPLLinesHandler,
  updatePLLineHandler,
} from "./plLines.controller";

const router = Router({ mergeParams: true });
router.get("/", listPLLinesHandler);
router.post("/", createPLLineHandler);
router.put("/:id", updatePLLineHandler);
router.delete("/:id", deletePLLineHandler);
export default router;
