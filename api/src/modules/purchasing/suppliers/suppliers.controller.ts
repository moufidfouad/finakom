import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "./suppliers.schemas";
import * as suppliersService from "./suppliers.service";
import { buildCsv } from "@/utils/csvExport";
import { sendCsv } from "@/utils/sendCsv";

type SupplierRow = Awaited<
  ReturnType<typeof suppliersService.listSuppliers>
>[number];

export const exportSuppliersCsvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const suppliers = await suppliersService.listSuppliers(
      req.params.companyId,
      requireAuthContext(req),
    );
    const csv = buildCsv<SupplierRow>(suppliers, [
      { header: "Code", value: (s) => s.code },
      { header: "Nom", value: (s) => s.name },
      { header: "Type", value: (s) => s.type },
      { header: "Adresse", value: (s) => s.address },
      { header: "Téléphone", value: (s) => s.phone },
      { header: "Email", value: (s) => s.email },
      { header: "RCCM", value: (s) => s.rccm },
      { header: "Fiabilité", value: (s) => s.quality },
    ]);
    sendCsv(res, "fournisseurs.csv", csv);
  },
);

export const listSuppliersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await suppliersService.listSuppliers(
        req.params.companyId,
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
          req.params.companyId,
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
