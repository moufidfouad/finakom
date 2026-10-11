import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createManualEntrySchema,
  trialBalanceQuerySchema,
} from "./journalEntries.schemas";
import * as journalEntriesService from "./journalEntries.service";
import { buildCsv } from "@/utils/csvExport";
import { sendCsv } from "@/utils/sendCsv";

export const listEntriesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { journal, accountId } = req.query as {
      journal?: string;
      accountId?: string;
    };
    res.json(
      await journalEntriesService.listEntries(
        req.params.companyId,
        requireAuthContext(req),
        { journal, accountId },
      ),
    );
  },
);
export const createManualEntryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createManualEntrySchema.parse(req.body);
    res
      .status(201)
      .json(
        await journalEntriesService.createManualEntry(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const deleteEntryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await journalEntriesService.deleteEntry(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);
export const getAccountLedgerHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await journalEntriesService.getAccountLedger(
        req.params.id,
        requireAuthContext(req),
      ),
    );
  },
);

export const exportAccountLedgerCsvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const ledger = await journalEntriesService.getAccountLedger(
      req.params.id,
      requireAuthContext(req),
    );
    const csv = buildCsv<(typeof ledger.lines)[number]>(ledger.lines, [
      {
        header: "Date",
        value: (l) => new Date(l.date).toLocaleDateString("fr-FR"),
      },
      { header: "Pièce", value: (l) => l.pieceNumber },
      { header: "Libellé", value: (l) => l.label },
      { header: "Débit", value: (l) => l.debit },
      { header: "Crédit", value: (l) => l.credit },
      { header: "Solde cumulé", value: (l) => l.runningBalance },
    ]);
    sendCsv(res, `grand-livre-${ledger.account.accountNumber}.csv`, csv);
  },
);
export const getTrialBalanceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = trialBalanceQuerySchema.parse(req.query);
    res.json(
      await journalEntriesService.getTrialBalance(
        req.params.companyId,
        requireAuthContext(req),
        query,
      ),
    );
  },
);

export const exportTrialBalanceCsvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = trialBalanceQuerySchema.parse(req.query);
    const balance = await journalEntriesService.getTrialBalance(
      req.params.companyId,
      requireAuthContext(req),
      query,
    );
    const csv = buildCsv(balance, [
      { header: "Compte", value: (b) => b.accountNumber },
      { header: "Libellé", value: (b) => b.label },
      { header: "Débit N", value: (b) => b.debitN },
      { header: "Crédit N", value: (b) => b.creditN },
      { header: "Débit N-1", value: (b) => b.debitN1 },
      { header: "Crédit N-1", value: (b) => b.creditN1 },
    ]);
    sendCsv(res, "balance-generale.csv", csv);
  },
);
