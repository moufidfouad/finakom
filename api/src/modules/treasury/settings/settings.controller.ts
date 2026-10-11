import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { upsertTreasurySettingsSchema } from "./settings.schemas";
import * as settingsService from "./settings.service";

export const getTreasurySettingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await settingsService.getTreasurySettings(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);
export const updateTreasurySettingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = upsertTreasurySettingsSchema.parse(req.body);
    res.json(
      await settingsService.updateTreasurySettings(
        req.params.companyId,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
