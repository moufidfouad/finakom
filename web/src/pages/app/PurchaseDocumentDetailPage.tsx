import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import {
  useConvertOrderToInvoice,
  useDeletePurchaseDocument,
  usePurchaseDocument,
  useUpdatePurchaseDocument,
  useUpdatePurchaseDocumentStatus,
} from "@/features/purchasing/purchaseDocuments.api";
import {
  useCreateSupplierPayment,
  useDeleteSupplierPayment,
  useSupplierPayments,
} from "@/features/purchasing/supplierPayments.api";
import { useSuppliers } from "@/features/purchasing/suppliers.api";
import { useProducts } from "@/features/invoicing/products.api";
import SupplierPaymentForm from "@/features/purchasing/SupplierPaymentForm";
import PurchaseDocumentForm from "@/features/purchasing/PurchaseDocumentForm";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAmount, formatDate } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/apiError";
import { useCompanyPermissions } from "@/features/companies/useCompanyPermissions";
import { useCompany } from "@/features/companies/companies.api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePublishCurrentCompany } from "@/hooks/usePublishCurrentCompany";
import { apiClient } from "@/lib/axios";
import { UpdatePurchaseDocumentInput } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import CurrencyProvider from "@/context/CurrencyContext";

const statusVariant: Record<
  string,
  "success" | "accent" | "destructive" | "secondary"
> = {
  Payée: "success",
  Confirmé: "success",
  Partielle: "accent",
  Envoyé: "secondary",
  Impayée: "destructive",
  Annulé: "destructive",
};

const STATUS_BY_TYPE: Record<string, string[]> = {
  "Bon de commande": ["Envoyé", "Confirmé", "Annulé"],
};

export default function PurchaseDocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const {
    data: doc,
    isLoading,
    error,
    isError,
  } = usePurchaseDocument(documentId);
  const updateStatus = useUpdatePurchaseDocumentStatus(documentId as string);
  const convertToInvoice = useConvertOrderToInvoice(doc?.companyId ?? "");
  const deleteDocument = useDeletePurchaseDocument(doc?.companyId ?? "");
  const { data: payments } = useSupplierPayments(
    doc?.type === "Facture fournisseur" ? documentId : undefined,
  );
  const createPayment = useCreateSupplierPayment(documentId as string);
  const deletePayment = useDeleteSupplierPayment(documentId as string);
  const { canModify } = useCompanyPermissions(doc?.companyId);
  const { data: company } = useCompany(doc?.companyId);
  usePublishCurrentCompany(
    company ? { id: company.id, name: company.name } : undefined,
  );
  const updateDocument = useUpdatePurchaseDocument(doc?.companyId ?? "");
  const { data: suppliers } = useSuppliers(doc?.companyId);
  const { data: products } = useProducts(doc?.companyId);

  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);

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
    doc.type === "Facture fournisseur"
      ? (doc.paymentSummary?.status ?? doc.status)
      : doc.status;
  const allowedStatuses = STATUS_BY_TYPE[doc.type] ?? [];
  const canEdit = canModify(doc.createdById);
  const linesLocked =
    doc.type === "Facture fournisseur" && doc.payments.length > 0;
  const linesLockedReason =
    "Cette facture fournisseur a déjà au moins un règlement enregistré : ses lignes ne peuvent plus être modifiées.";

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
              {doc.supplier?.name} · {formatDate(doc.date)}
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
            {canEdit && doc.type !== "Facture fournisseur" && (
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
            {canEdit &&
              doc.type === "Bon de commande" &&
              doc.status === "Confirmé" && (
                <Button
                  size="sm"
                  variant="accent"
                  isLoading={convertToInvoice.isPending}
                  onClick={async () => {
                    const invoice = await convertToInvoice.mutateAsync(doc.id);
                    navigate(`/app/purchase-documents/${invoice.id}`);
                  }}
                >
                  Convertir en facture fournisseur
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
                    `${apiClient.defaults.baseURL}/purchase-documents/${doc.id}/pdf`,
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

        {/* Règlements (Facture fournisseur uniquement) */}
        {doc.type === "Facture fournisseur" && (
          <Card className="mt-6">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Règlements</CardTitle>
              {canEdit && (
                <Button
                  size="sm"
                  variant="accent"
                  onClick={() => setPaymentFormOpen(true)}
                >
                  <Plus className="h-4 w-4" /> Règlement
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {doc.paymentSummary && (
                <div className="mb-4 grid grid-cols-2 gap-4 rounded-md bg-secondary/50 p-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Réglé</p>
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
                    <p className="text-xs text-muted-foreground">% réglé</p>
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
              {payments && payments.length === 0 && (
                <EmptyState
                  message="Aucun règlement enregistré."
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
            <PurchaseDocumentForm
              suppliers={suppliers ?? []}
              products={products ?? []}
              lockType
              linesLocked={linesLocked}
              linesLockedReason={linesLockedReason}
              submitLabel="Enregistrer les modifications"
              initialValues={{
                type: doc.type,
                supplierId: doc.supplierId,
                date: doc.date.slice(0, 10),
                notes: doc.notes ?? "",
                lines: doc.lines.map((l) => ({
                  productId: l.productId ?? "",
                  quantity: Number(l.quantity),
                  unitPriceHT: Number(l.unitPriceHT),
                })),
              }}
              onSubmit={async (values) => {
                const input: UpdatePurchaseDocumentInput = {
                  supplierId: values.supplierId,
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
              <DialogTitle>Enregistrer un règlement</DialogTitle>
            </DialogHeader>
            <SupplierPaymentForm
              onSubmit={async (values) => {
                await createPayment.mutateAsync(values);
                setPaymentFormOpen(false);
              }}
              onCancel={() => setPaymentFormOpen(false)}
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
              <strong>{doc.number}</strong>. Cette action est irréversible.
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
