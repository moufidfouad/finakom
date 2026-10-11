import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { AppError } from "@/utils/AppError";
import { parseBankStatementFile } from "./bankStatement.parser";
import * as reconciliationService from "./reconciliation.service";

const matchSchema = z.object({
  treasuryEntryId: z.string().uuid("Écriture invalide"),
});
const summaryQuerySchema = z.object({
  bankStatementBalance: z.coerce.number(),
});

export const importStatementHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const auth = requireAuthContext(req);
    if (!req.file)
      throw AppError.badRequest('Aucun fichier fourni (champ "file" attendu)');
    const lines = parseBankStatementFile(
      req.file.buffer,
      req.file.originalname,
    );
    res
      .status(201)
      .json(
        await reconciliationService.importStatementLines(
          req.params.companyId,
          auth,
          lines,
        ),
      );
  },
);

export const listStatementLinesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { onlyUnmatched } = req.query as { onlyUnmatched?: string };
    res.json(
      await reconciliationService.listStatementLines(
        req.params.companyId,
        requireAuthContext(req),
        { onlyUnmatched: onlyUnmatched === "true" },
      ),
    );
  },
);

export const matchStatementLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { treasuryEntryId } = matchSchema.parse(req.body);
    res.json(
      await reconciliationService.matchStatementLine(
        req.params.id,
        treasuryEntryId,
        requireAuthContext(req),
      ),
    );
  },
);

export const unmatchStatementLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await reconciliationService.unmatchStatementLine(
        req.params.id,
        requireAuthContext(req),
      ),
    );
  },
);

export const getSuggestedMatchesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await reconciliationService.getSuggestedMatches(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);

export const getReconciliationSummaryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { bankStatementBalance } = summaryQuerySchema.parse(req.query);
    res.json(
      await reconciliationService.getReconciliationSummary(
        req.params.companyId,
        requireAuthContext(req),
        bankStatementBalance,
      ),
    );
  },
);
