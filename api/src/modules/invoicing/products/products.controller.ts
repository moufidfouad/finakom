import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import { createProductSchema, updateProductSchema } from "./products.schemas";
import * as productsService from "./products.service";
import { buildCsv } from "@/utils/csvExport";
import { sendCsv } from "@/utils/sendCsv";

type ProductRow = Awaited<
  ReturnType<typeof productsService.listProducts>
>[number];

export const listProductsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await productsService.listProducts(
        req.params.companyId,
        requireAuthContext(req),
      ),
    );
  },
);

export const exportProductsCsvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const products = await productsService.listProducts(
      req.params.companyId,
      requireAuthContext(req),
    );
    const csv = buildCsv<ProductRow>(products, [
      { header: "Code", value: (p) => p.code },
      { header: "Désignation", value: (p) => p.designation },
      { header: "Unité", value: (p) => p.unit },
      { header: "Catégorie", value: (p) => p.category },
      { header: "Prix de vente HT", value: (p) => Number(p.sellingPriceHT) },
      {
        header: "Coût unitaire",
        value: (p) => (p.unitCost !== null ? Number(p.unitCost) : null),
      },
      {
        header: "Stock suivi",
        value: (p) => (p.trackInventory ? "Oui" : "Non"),
      },
      { header: "Stock final", value: (p) => p.stock?.stockFinal ?? null },
      { header: "Stock minimum", value: (p) => Number(p.stockMin) },
      { header: "Alerte", value: (p) => p.stock?.alertLabel ?? null },
    ]);
    sendCsv(res, "catalogue-produits.csv", csv);
  },
);
export const createProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createProductSchema.parse(req.body);
    res
      .status(201)
      .json(
        await productsService.createProduct(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const getProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await productsService.getProduct(req.params.id, requireAuthContext(req)),
    );
  },
);
export const updateProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateProductSchema.parse(req.body);
    res.json(
      await productsService.updateProduct(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const deleteProductHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await productsService.deleteProduct(req.params.id, requireAuthContext(req));
    res.status(204).send();
  },
);
