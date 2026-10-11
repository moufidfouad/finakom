import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createFixedAssetSchema,
  updateFixedAssetSchema,
} from "./assets.schemas";
import * as assetsService from "./assets.service";

export const listFixedAssetsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await assetsService.listFixedAssets(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createFixedAssetHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createFixedAssetSchema.parse(req.body);
    res
      .status(201)
      .json(
        await assetsService.createFixedAsset(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const getFixedAssetHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await assetsService.getFixedAsset(req.params.id, requireAuthContext(req)),
    );
  },
);
export const updateFixedAssetHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateFixedAssetSchema.parse(req.body);
    res.json(
      await assetsService.updateFixedAsset(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteFixedAssetHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await assetsService.deleteFixedAsset(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);
