import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { AppError } from "@/utils/AppError";
import { requireAuthContext } from "@/utils/authContext";
import { replaceBalanceSchema } from "./balance.schemas";
import * as balanceService from "./balance.service";
import { parseBalanceFile } from "./balance.parser";

export const getBalanceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    res.json(await balanceService.getBalance(req.params.id, auth));
  },
);

export const replaceBalanceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    const input = replaceBalanceSchema.parse(req.body);
    res
      .status(200)
      .json(await balanceService.replaceBalance(req.params.id, auth, input));
  },
);

export const importBalanceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    if (!req.file)
      throw AppError.badRequest('Aucun fichier fourni (champ "file" attendu)');
    const lines = parseBalanceFile(req.file.buffer, req.file.originalname);
    res
      .status(200)
      .json(
        await balanceService.replaceBalance(req.params.id, auth, { lines }),
      );
  },
);

export const generateBalanceFromLedgerHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    res
      .status(200)
      .json(
        await balanceService.generateBalanceFromLedger(req.params.id, auth),
      );
  },
);
