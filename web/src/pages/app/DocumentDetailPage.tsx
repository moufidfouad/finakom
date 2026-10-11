import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Truck,
} from "lucide-react";
import {
  useConvertToInvoice,
  useCreateDeliveryNoteFromInvoice,
  useDeleteDocument,
  useDeliverLine,
  useDocument,
  useUpdateDocument,
  useUpdateDocumentStatus,
} from "@/features/invoicing/documents.api";
import {
  useCreatePayment,
  useDeletePayment,
  usePayments,
} from "@/features/invoicing/payments.api";
import { useClients } from "@/features/invoicing/clients.api";
import { useProducts } from "@/features/invoicing/products.api";
import PaymentForm from "@/features/invoicing/PaymentForm";
import DocumentForm from "@/features/invoicing/DocumentForm";
import CreditNoteForm from "@/features/invoicing/CreditNoteForm";
import { useDocuments } from "@/features/invoicing/documents.api";
import { STATUS_BY_TYPE } from "@/features/invoicing/invoicing.constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAmount, formatDate } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/apiError";
import { apiClient } from "@/lib/axios";
import { useCompanyPermissions } from "@/features/companies/useCompanyPermissions";
import { useCompany } from "@/features/companies/companies.api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePublishCurrentCompany } from "@/hooks/usePublishCurrentCompany";
import { UpdateDocumentInput } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import CurrencyProvider from "@/context/CurrencyContext";

const statusVariant: Record<
  string,
  "success" | "accent" | "destructive" | "secondary"
> = {
  Payée: "success",
  Accepté: "success",
  Livré: "success",
  Partielle: "accent",
  "En préparation": "accent",
  Envoyé: "secondary",
  Impayée: "destructive",
  Refusé: "destructive",
  Expiré: "destructive",
};

export default function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { data: doc, isLoading, error, isError } = useDocument(documentId);
  const updateStatus = useUpdateDocumentStatus(documentId as string);
  const deliverLine = useDeliverLine(documentId as string);
  const convertToInvoice = useConvertToInvoice(doc?.companyId ?? "");
  const createDeliveryNote = useCreateDeliveryNoteFromInvoice(
    doc?.companyId ?? "",
  );
  const deleteDocument = useDeleteDocument(doc?.companyId ?? "");
  const { data: payments } = usePayments(
    doc?.type === "Facture" ? documentId : undefined,
  );
  const createPayment = useCreatePayment(documentId as string);
  const deletePayment = useDeletePayment(documentId as string);
  const { canModify } = useCompanyPermissions(doc?.companyId);
  const { data: company } = useCompany(doc?.companyId);
  usePublishCurrentCompany(
    company ? { id: company.id, name: company.name } : undefined,
  );
  const updateDocument = useUpdateDocument(doc?.companyId ?? "");
  const { data: clients } = useClients(doc?.companyId);
  const { data: products } = useProducts(doc?.companyId);
  const { data: allCreditNotes } = useDocuments(
    doc?.type === "Facture" ? doc.companyId : undefined,
    { type: "Avoir" },
  );
  const creditNotes = (allCreditNotes ?? []).filter(
    (cn) => cn.linkedInvoiceId === doc?.id,
  );

  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [creditNoteFormOpen, setCreditNoteFormOpen] = useState(false);

  const [deliverValues, setDeliverValues] = useState<Record<string, number>>(
    {},
  );

  if (isLoading)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <LoadingState />
      </div>
    );
  if (isError || !doc) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-destructive">
          {getApiErrorMessage(error, "Document introuvable.")}
        </p>
      </div>
    );
  }

  const effectiveStatus =
    doc.type === "Facture"
      ? (doc.paymentSummary?.status ?? doc.status)
      : doc.status;
  const allowedStatuses = STATUS_BY_TYPE[doc.type] ?? [];
  const canEdit = canModify(doc.createdById);
  const linesLocked =
    (doc.type === "Facture" && doc.payments.length > 0) ||
    (doc.type === "Bon de livraison" &&
      doc.lines.some((l) => Number(l.quantityDelivered ?? 0) > 0));
  const linesLockedReason =
    doc.type === "Facture"
      ? "Cette facture a déjà au moins un paiement enregistré : ses lignes ne peuvent plus être modifiées."
      : "Ce bon de livraison a des lignes déjà livrées (mouvements de stock générés) : ses lignes ne peuvent plus être modifiées.";

  return (
    <CurrencyProvider currency={company?.currency}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to={`/app/entreprises/${doc.companyId}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Retour à l'entreprise
        </Link>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {doc.type}
            </p>
            <h1 className="mt-0.5 font-mono text-xl font-medium text-foreground">
              {doc.number}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {doc.client?.name} · {formatDate(doc.date)}
            </p>
            {doc.createdBy && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Créé par {doc.createdBy.fullName || doc.createdBy.email}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={statusVariant[effectiveStatus] ?? "secondary"}
              className="text-sm"
            >
              {effectiveStatus}
            </Badge>
            {canEdit && doc.type !== "Facture" && (
              <Select
                value={doc.status}
                onValueChange={(v) => updateStatus.mutate(v)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {canEdit && doc.type === "Devis" && doc.status === "Accepté" && (
              <Button
                size="sm"
                variant="accent"
                isLoading={convertToInvoice.isPending}
                onClick={async () => {
                  const invoice = await convertToInvoice.mutateAsync(doc.id);
                  navigate(`/app/documents/${invoice.id}`);
                }}
              >
                Convertir en facture
              </Button>
            )}
            {canEdit && doc.type === "Facture" && (
              <Button
                size="sm"
                variant="outline"
                isLoading={createDeliveryNote.isPending}
                onClick={async () => {
                  const deliveryNote = await createDeliveryNote.mutateAsync(
                    doc.id,
                  );
                  navigate(`/app/documents/${deliveryNote.id}`);
                }}
              >
                <Truck className="h-4 w-4" /> Créer un bon de livraison
              </Button>
            )}
            {canEdit && doc.type === "Facture" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreditNoteFormOpen(true)}
              >
                <ReceiptText className="h-4 w-4" /> Émettre un avoir
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditFormOpen(true)}
              >
                <Pencil className="h-4 w-4" /> Modifier
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  window.open(
                    `${apiClient.defaults.baseURL}/documents/${doc.id}/pdf`,
                    "_blank",
                  )
                }
              >
                <FileText className="h-4 w-4" /> Voir le PDF
              </Button>
            )}
            {canEdit && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>

        {/* Lignes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Lignes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Désignation</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">PU HT</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                  {doc.type === "Bon de livraison" && (
                    <TableHead className="text-right">Livré</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {doc.lines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      {l.designation}
                      {l.observation && (
                        <p className="text-xs text-muted-foreground">
                          {l.observation}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {l.quantity}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatAmount(Number(l.unitPriceHT), company?.currency)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatAmount(
                        Number(l.quantity) * Number(l.unitPriceHT),
                        company?.currency,
                      )}
                    </TableCell>
                    {doc.type === "Bon de livraison" && (
                      <TableCell className="text-right">
                        {canEdit ? (
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              className="w-20"
                              value={
                                deliverValues[l.id] ??
                                Number(l.quantityDelivered ?? 0)
                              }
                              onChange={(e) =>
                                setDeliverValues((v) => ({
                                  ...v,
                                  [l.id]: Number(e.target.value),
                                }))
                              }
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              isLoading={deliverLine.isPending}
                              onClick={() =>
                                deliverLine.mutate({
                                  lineId: l.id,
                                  quantityDelivered:
                                    deliverValues[l.id] ??
                                    Number(l.quantityDelivered ?? 0),
                                })
                              }
                            >
                              Livrer
                            </Button>
                          </div>
                        ) : (
                          <span className="tabular text-muted-foreground">
                            {Number(l.quantityDelivered ?? 0)}
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col items-end gap-1 border-t border-border p-4 text-sm">
              <p className="text-muted-foreground">
                Total HT :{" "}
                <span className="tabular font-medium text-foreground">
                  {formatAmount(doc.totals.totalHT, company?.currency)}
                </span>
              </p>
              <p className="text-muted-foreground">
                TVA ({Number(doc.tvaRatePercent)}%) :{" "}
                <span className="tabular font-medium text-foreground">
                  {formatAmount(doc.totals.totalTVA, company?.currency)}
                </span>
              </p>
              <p className="text-base text-foreground">
                Total TTC :{" "}
                <span className="tabular font-semibold">
                  {formatAmount(doc.totals.totalTTC, company?.currency)}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Paiements (Facture uniquement) */}
        {doc.type === "Facture" && (
          <Card className="mt-6">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Paiements</CardTitle>
              {canEdit && (
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setPaymentFormOpen(true)}
                >
                  <Plus className="h-4 w-4" /> Paiement
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {doc.paymentSummary && (
                <div className="mb-4 grid grid-cols-2 gap-4 rounded-md bg-secondary/50 p-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Réglé + avoirs
                    </p>
                    <p className="tabular font-medium">
                      {formatAmount(
                        doc.paymentSummary.totalPaid,
                        company?.currency,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reste dû</p>
                    <p className="tabular font-medium">
                      {formatAmount(
                        doc.paymentSummary.remaining,
                        company?.currency,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">% soldé</p>
                    <p className="tabular font-medium">
                      {(doc.paymentSummary.percentPaid * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Statut</p>
                    <Badge variant={statusVariant[doc.paymentSummary.status]}>
                      {doc.paymentSummary.status}
                    </Badge>
                  </div>
                </div>
              )}
              {creditNotes.length > 0 && (
                <p className="mb-4 text-xs text-muted-foreground">
                  « Réglé + avoirs » inclut {creditNotes.length} avoir(s) (
                  {formatAmount(
                    creditNotes.reduce((s, cn) => s + cn.totals.totalTTC, 0),
                    company?.currency,
                  )}
                  ) en plus des règlements réels ci-dessous.
                </p>
              )}
              {payments && payments.length === 0 && (
                <EmptyState
                  message="Aucun paiement enregistré."
                  variant="compact"
                />
              )}
              {payments && payments.length > 0 && (
                <ul className="divide-y divide-border">
                  {payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {formatDate(p.date)} · {p.method || "—"}
                      </span>
                      <span className="tabular font-medium">
                        {formatAmount(Number(p.amount), company?.currency)}
                      </span>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePayment.mutate(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* Avoirs liés (Facture uniquement) */}
        {doc.type === "Facture" && creditNotes.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Avoirs émis sur cette facture</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {creditNotes.map((cn) => (
                  <li
                    key={cn.id}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <Link
                      to={`/app/documents/${cn.id}`}
                      className="flex items-center gap-2 font-mono text-xs text-primary hover:underline"
                    >
                      <ReceiptText className="h-3.5 w-3.5" /> {cn.number}
                    </Link>
                    <span className="text-muted-foreground">
                      {formatDate(cn.date)}
                    </span>
                    <span className="tabular font-medium">
                      {formatAmount(cn.totals.totalTTC, company?.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {doc.notes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{doc.notes}</p>
            </CardContent>
          </Card>
        )}

        <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier {doc.number}</DialogTitle>
            </DialogHeader>
            <DocumentForm
              clients={clients ?? []}
              products={products ?? []}
              lockType
              linesLocked={linesLocked}
              linesLockedReason={linesLockedReason}
              submitLabel="Enregistrer les modifications"
              initialValues={{
                type: doc.type,
                clientId: doc.clientId,
                date: doc.date.slice(0, 10),
                notes: doc.notes ?? "",
                lines: doc.lines.map((l) => ({
                  productId: l.productId ?? "",
                  quantity: Number(l.quantity),
                  unitPriceHT: Number(l.unitPriceHT),
                })),
              }}
              onSubmit={async (values) => {
                const input: UpdateDocumentInput = {
                  clientId: values.clientId,
                  date: values.date,
                  notes: values.notes,
                };
                if (values.lines) input.lines = values.lines;
                await updateDocument.mutateAsync({ id: doc.id, input });
                setEditFormOpen(false);
              }}
              onCancel={() => setEditFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={paymentFormOpen} onOpenChange={setPaymentFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enregistrer un paiement</DialogTitle>
            </DialogHeader>
            <PaymentForm
              onSubmit={async (values) => {
                await createPayment.mutateAsync(values);
                setPaymentFormOpen(false);
              }}
              onCancel={() => setPaymentFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={creditNoteFormOpen} onOpenChange={setCreditNoteFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Émettre un avoir sur {doc.number}</DialogTitle>
            </DialogHeader>
            <CreditNoteForm
              invoice={doc}
              products={products ?? []}
              onSuccess={() => setCreditNoteFormOpen(false)}
              onCancel={() => setCreditNoteFormOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Supprimer ce document ?"
          description={
            <>
              Cette action supprimera définitivement{" "}
              <strong>{doc.number}</strong>
              {doc.type === "Bon de livraison" &&
                " ainsi que les mouvements de stock associés"}
              . Cette action est irréversible.
            </>
          }
          confirmLabel="Confirmer la suppression"
          isLoading={deleteDocument.isPending}
          onConfirm={async () => {
            await deleteDocument.mutateAsync(doc.id);
            navigate(`/app/entreprises/${doc.companyId}`);
          }}
        />
      </div>
    </CurrencyProvider>
  );
}
