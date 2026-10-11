import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { upsertTaxSettingsSchema } from "./settings.schemas";
import * as settingsService from "./settings.service";

export const getTaxSettingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await settingsService.getTaxSettings(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);
export const updateTaxSettingsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = upsertTaxSettingsSchema.parse(req.body);
    res.json(
      await settingsService.updateTaxSettings(
        req.params.companyId,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
