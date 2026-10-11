import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createPurchaseDocumentSchema,
  updatePurchaseDocumentSchema,
  updatePurchaseStatusSchema,
} from "./purchaseDocuments.schemas";
import * as purchaseDocumentsService from "./purchaseDocuments.service";
import { buildCsv } from "@/utils/csvExport";
import { sendCsv } from "@/utils/sendCsv";

type PurchaseDocumentRow = Awaited<
  ReturnType<typeof purchaseDocumentsService.listPurchaseDocuments>
>[number];

export const exportPurchaseDocumentsCsvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { type, status } = req.query as { type?: string; status?: string };
    const documents = await purchaseDocumentsService.listPurchaseDocuments(
      req.params.companyId,
      requireAuthContext(req),
      { type, status },
    );
    const csv = buildCsv<PurchaseDocumentRow>(documents, [
      { header: "N°", value: (d) => d.number },
      { header: "Type", value: (d) => d.type },
      { header: "Fournisseur", value: (d) => d.supplier?.name ?? "" },
      {
        header: "Date",
        value: (d) => new Date(d.date).toLocaleDateString("fr-FR"),
      },
      { header: "Total HT", value: (d) => d.totals.totalHT },
      { header: "Total TVA", value: (d) => d.totals.totalTVA },
      { header: "Total TTC", value: (d) => d.totals.totalTTC },
      { header: "Statut", value: (d) => d.paymentSummary?.status ?? d.status },
    ]);
    sendCsv(res, "documents-achats.csv", csv);
  },
);

export const listPurchaseDocumentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { type, status } = req.query as { type?: string; status?: string };
    res.json(
      await purchaseDocumentsService.listPurchaseDocuments(
        req.params.companyId,
        requireAuthContext(req),
        { type, status },
      ),
    );
  },
);
export const createPurchaseDocumentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createPurchaseDocumentSchema.parse(req.body);
    res
      .status(201)
      .json(
        await purchaseDocumentsService.createPurchaseDocument(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);
export const getPurchaseDocumentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await purchaseDocumentsService.getPurchaseDocument(
        req.params.id,
        requireAuthContext(req),
      ),
    );
  },
);
export const updatePurchaseDocumentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updatePurchaseDocumentSchema.parse(req.body);
    res.json(
      await purchaseDocumentsService.updatePurchaseDocument(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);
export const updatePurchaseStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = updatePurchaseStatusSchema.parse(req.body);
    res.json(
      await purchaseDocumentsService.updatePurchaseStatus(
        req.params.id,
        requireAuthContext(req),
        status,
      ),
    );
  },
);
export const convertOrderToInvoiceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res
      .status(201)
      .json(
        await purchaseDocumentsService.convertOrderToInvoice(
          req.params.id,
          requireAuthContext(req),
        ),
      );
  },
);
export const deletePurchaseDocumentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await purchaseDocumentsService.deletePurchaseDocument(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);
