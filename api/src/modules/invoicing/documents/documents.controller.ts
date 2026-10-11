import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuthContext } from "@/utils/authContext";
import {
  createDocumentSchema,
  deliverLineSchema,
  updateDocumentSchema,
  updateStatusSchema,
} from "./documents.schemas";
import * as documentsService from "./documents.service";
import { buildCsv } from "@/utils/csvExport";
import { sendCsv } from "@/utils/sendCsv";

type DocumentRow = Awaited<
  ReturnType<typeof documentsService.listDocuments>
>[number];

export const exportDocumentsCsvHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { type, status } = req.query as { type?: string; status?: string };
    const documents = await documentsService.listDocuments(
      req.params.companyId,
      requireAuthContext(req),
      { type, status },
    );
    const csv = buildCsv<DocumentRow>(documents, [
      { header: "N°", value: (d) => d.number },
      { header: "Type", value: (d) => d.type },
      { header: "Client", value: (d) => d.client?.name ?? "" },
      {
        header: "Date",
        value: (d) => new Date(d.date).toLocaleDateString("fr-FR"),
      },
      { header: "Total HT", value: (d) => d.totals.totalHT },
      { header: "Total TVA", value: (d) => d.totals.totalTVA },
      { header: "Total TTC", value: (d) => d.totals.totalTTC },
      { header: "Statut", value: (d) => d.paymentSummary?.status ?? d.status },
    ]);
    sendCsv(res, "documents-commerciaux.csv", csv);
  },
);

export const listDocumentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { type, status } = req.query as { type?: string; status?: string };
    res.json(
      await documentsService.listDocuments(
        req.params.companyId,
        requireAuthContext(req),
        { type, status },
      ),
    );
  },
);

export const createDocumentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = createDocumentSchema.parse(req.body);
    res
      .status(201)
      .json(
        await documentsService.createDocument(
          req.params.companyId,
          requireAuthContext(req),
          input,
        ),
      );
  },
);

export const getDocumentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res.json(
      await documentsService.getDocument(
        req.params.id,
        requireAuthContext(req),
      ),
    );
  },
);

export const updateDocumentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updateDocumentSchema.parse(req.body);
    res.json(
      await documentsService.updateDocument(
        req.params.id,
        requireAuthContext(req),
        input,
      ),
    );
  },
);

export const updateStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { status } = updateStatusSchema.parse(req.body);
    res.json(
      await documentsService.updateStatus(
        req.params.id,
        requireAuthContext(req),
        status,
      ),
    );
  },
);

export const deliverLineHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { quantityDelivered } = deliverLineSchema.parse(req.body);
    res.json(
      await documentsService.deliverLine(
        req.params.id,
        req.params.lineId,
        requireAuthContext(req),
        quantityDelivered,
      ),
    );
  },
);

export const convertToInvoiceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res
      .status(201)
      .json(
        await documentsService.convertQuoteToInvoice(
          req.params.id,
          requireAuthContext(req),
        ),
      );
  },
);

export const createDeliveryNoteFromInvoiceHandler = asyncHandler(
  async (req: Request, res: Response) => {
    res
      .status(201)
      .json(
        await documentsService.createDeliveryNoteFromInvoice(
          req.params.id,
          requireAuthContext(req),
        ),
      );
  },
);

export const deleteDocumentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    await documentsService.deleteDocument(
      req.params.id,
      requireAuthContext(req),
    );
    res.status(204).send();
  },
);
