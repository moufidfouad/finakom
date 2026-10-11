import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createTreasuryEntrySchema,
  updateTreasuryEntrySchema,
} from "./entries.schemas";
import * as entriesService from "./entries.service";

export const listEntriesHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { from, to } = req.query as { from?: string; to?: string };
    res.json(
      await entriesService.listEntries(
        req.params.companyId,
        requireAuthContext(req),
        {
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined,
        },
      ),
    );
  },
);
export const createEntryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createTreasuryEntrySchema.parse(req.body);
    res
      .status(201)
      .json(
        await entriesService.createEntry(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const updateEntryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateTreasuryEntrySchema.parse(req.body);
    res.json(
      await entriesService.updateEntry(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteEntryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await entriesService.deleteEntry(req.params.id, requireAuthContext(req));
    res.status(204).send();
  },
);
