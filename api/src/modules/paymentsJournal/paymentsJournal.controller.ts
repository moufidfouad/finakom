import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { getPaymentsJournal } from "./paymentsJournal.service";

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export const getPaymentsJournalHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    res.json(
      await getPaymentsJournal(req.params.companyId, requireAuthContext(req), {
        from,
        to,
      }),
    );
  },
);
