import { RawBalanceLine } from "./engine.types";
import { enrichLines } from "./engine.utils";
import { buildControles } from "./buildControles";
import { buildBilan } from "./buildBilan";
import { buildResultat } from "./buildResultat";
import { buildRatios } from "./buildRatios";
import { buildSynthese } from "./buildSynthese";

export function buildFullReport(rawLines: RawBalanceLine[]) {
  const lines = enrichLines(rawLines);
  const controles = buildControles(lines);
  const bilan = buildBilan(lines);
  const resultat = buildResultat(lines);
  const ratios = buildRatios(bilan, resultat);
  const synthese = buildSynthese(bilan, resultat, controles);
  return { controles, bilan, resultat, ratios, synthese };
}

export type FullReport = ReturnType<typeof buildFullReport>;
