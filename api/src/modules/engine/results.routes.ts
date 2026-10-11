import { Router } from "express";
import {
  getBilanHandler,
  getControlesHandler,
  getRapportCompletHandler,
  getRatiosHandler,
  getResultatHandler,
  getSyntheseHandler,
} from "./results.controller";

const router = Router({ mergeParams: true });

router.get("/controles", getControlesHandler);
router.get("/bilan", getBilanHandler);
router.get("/resultat", getResultatHandler);
router.get("/ratios", getRatiosHandler);
router.get("/synthese", getSyntheseHandler);
router.get("/rapport-complet", getRapportCompletHandler);

export default router;
