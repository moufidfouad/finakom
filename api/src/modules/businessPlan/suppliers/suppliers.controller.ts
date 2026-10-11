import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "./suppliers.schemas";
import * as suppliersService from "./suppliers.service";

export const listSuppliersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await suppliersService.listSuppliers(
        req.params.planId,
        requireAuthContext(req),
      ),
    );
  },
);
export const createSupplierHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createSupplierSchema.parse(req.body);
    res
      .status(201)
      .json(
        await suppliersService.createSupplier(
          req.params.planId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const updateSupplierHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateSupplierSchema.parse(req.body);
    res.json(
      await suppliersService.updateSupplier(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteSupplierHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await suppliersService.deleteSupplier(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);
