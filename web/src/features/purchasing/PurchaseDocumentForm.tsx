import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  DocumentLineInput,
  Product,
  PurchaseDocumentType,
  Supplier,
} from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import FormTextArea from "@/components/form/FormTextArea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const PURCHASE_DOCUMENT_TYPES: PurchaseDocumentType[] = [
  "Bon de commande",
  "Facture fournisseur",
];

interface LineFormValue {
  productId: string;
  quantity: number;
  unitPriceHT: number;
}

interface PurchaseDocumentFormValues {
  type: PurchaseDocumentType;
  supplierId: string;
  date: string;
  notes: string;
  lines: LineFormValue[];
}

export interface PurchaseDocumentFormSubmitValues {
  type: PurchaseDocumentType;
  supplierId: string;
  date: string;
  notes?: string;
  lines?: DocumentLineInput[];
}

const lineSchema = Yup.object({
  productId: Yup.string().required("Sélectionnez un article"),
  quantity: Yup.number().positive("Doit être positif").required("Requis"),
  unitPriceHT: Yup.number().min(0).required("Requis"),
});

const documentSchema = Yup.object({
  type: Yup.string().oneOf(PURCHASE_DOCUMENT_TYPES).required(),
  supplierId: Yup.string().required("Le fournisseur est requis"),
  date: Yup.string().required("La date est requise"),
  notes: Yup.string().optional(),
  lines: Yup.array().of(lineSchema).min(1, "Ajoutez au moins une ligne"),
});

function emptyLine(): LineFormValue {
  return { productId: "", quantity: 1, unitPriceHT: 0 };
}

interface PurchaseDocumentFormProps {
  suppliers: Supplier[];
  products: Product[];
  defaultType?: PurchaseDocumentType;
  initialValues?: PurchaseDocumentFormValues;
  lockType?: boolean;
  linesLocked?: boolean;
  linesLockedReason?: string;
  submitLabel?: string;
  onSubmit: (values: PurchaseDocumentFormSubmitValues) => Promise<void>;
  onCancel?: () => void;
}

export default function PurchaseDocumentForm({
  suppliers,
  products,
  defaultType = "Bon de commande",
  initialValues,
  lockType = false,
  linesLocked = false,
  linesLockedReason,
  submitLabel = "Créer le document",
  onSubmit,
  onCancel,
}: PurchaseDocumentFormProps) {
  const formatAmount = useFormatAmount();
  const [formError, setFormError] = useState("");

  const startValues: PurchaseDocumentFormValues = initialValues ?? {
    type: defaultType,
    supplierId: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
    lines: [emptyLine()],
  };

  return (
    <Formik
      initialValues={startValues}
      validationSchema={documentSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await onSubmit({
            type: values.type,
            supplierId: values.supplierId,
            date: values.date,
            notes: values.notes || undefined,
            ...(linesLocked
              ? {}
              : {
                  lines: values.lines.map((l) => ({
                    productId: l.productId,
                    quantity: l.quantity,
                    unitPriceHT: l.unitPriceHT,
                  })),
                }),
          });
        } catch (err) {
          setFormError(
            getApiErrorMessage(err, "Impossible d'enregistrer le document."),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, values, setFieldValue }) => {
        const totalHT = values.lines.reduce(
          (sum, l) =>
            sum + (Number(l.quantity) || 0) * (Number(l.unitPriceHT) || 0),
          0,
        );

        return (
          <Form className="flex flex-col gap-5" noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              {lockType ? (
                <div className="flex flex-col gap-1.5">
                  <Label>Type de document</Label>
                  <p className="flex h-9 items-center text-sm text-muted-foreground">
                    {values.type} (non modifiable)
                  </p>
                </div>
              ) : (
                <FormSelectField
                  name="type"
                  label="Type de document"
                  options={PURCHASE_DOCUMENT_TYPES.map((t) => ({
                    value: t,
                    label: t,
                  }))}
                />
              )}
              <FormTextField name="date" label="Date" type="date" />
            </div>

            <FormSelectField
              name="supplierId"
              label="Fournisseur"
              placeholder="Sélectionner un fournisseur"
              options={suppliers.map((s) => ({
                value: s.id,
                label: `${s.code} — ${s.name}`,
              }))}
            />

            <div>
              <Label>Lignes de l'article</Label>

              {linesLocked && (
                <p className="mt-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                  {linesLockedReason ??
                    "Les lignes ne sont plus modifiables pour ce document."}
                </p>
              )}

              {linesLocked ? (
                <div className="mt-2 flex flex-col gap-2">
                  {values.lines.map((line, index) => {
                    const product = products.find(
                      (p) => p.id === line.productId,
                    );
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
                      >
                        <span>
                          {product?.designation ?? "Article"} × {line.quantity}
                        </span>
                        <span className="tabular text-muted-foreground">
                          {formatAmount(line.quantity * line.unitPriceHT)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <FieldArray name="lines">
                  {({ push, remove }) => (
                    <div className="mt-2 flex flex-col gap-3">
                      {values.lines.map((line, index) => {
                        const product = products.find(
                          (p) => p.id === line.productId,
                        );
                        const lineTotal =
                          (Number(line.quantity) || 0) *
                          (Number(line.unitPriceHT) || 0);
                        return (
                          <div
                            key={index}
                            className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-[2fr_1fr_1fr_auto_auto] sm:items-end"
                          >
                            <div className="flex flex-col gap-1.5">
                              <Label className="sm:hidden">Article</Label>
                              <Select
                                value={line.productId}
                                onValueChange={(v) => {
                                  setFieldValue(`lines.${index}.productId`, v);
                                  const p = products.find((pr) => pr.id === v);
                                  if (p)
                                    setFieldValue(
                                      `lines.${index}.unitPriceHT`,
                                      Number(p.unitCost ?? p.sellingPriceHT),
                                    );
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Article du catalogue" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.code} — {p.designation}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <Label className="sm:hidden">Quantité</Label>
                              <Input
                                type="number"
                                placeholder="Qté"
                                value={line.quantity}
                                onChange={(e) =>
                                  setFieldValue(
                                    `lines.${index}.quantity`,
                                    Number(e.target.value),
                                  )
                                }
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <Label className="sm:hidden">PU HT</Label>
                              <Input
                                type="number"
                                placeholder="PU HT"
                                value={line.unitPriceHT}
                                onChange={(e) =>
                                  setFieldValue(
                                    `lines.${index}.unitPriceHT`,
                                    Number(e.target.value),
                                  )
                                }
                              />
                            </div>
                            <p className="tabular self-center text-sm text-muted-foreground">
                              {product ? formatAmount(lineTotal) : "—"}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                values.lines.length > 1 && remove(index)
                              }
                              aria-label="Supprimer la ligne"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="self-start"
                        onClick={() => push(emptyLine())}
                      >
                        <Plus className="h-4 w-4" /> Ajouter une ligne
                      </Button>
                    </div>
                  )}
                </FieldArray>
              )}
            </div>

            <div className="flex justify-end border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Total HT :{" "}
                <span className="tabular font-medium text-foreground">
                  {formatAmount(totalHT)}
                </span>
              </p>
            </div>

            <FormTextArea name="notes" label="Notes (optionnel)" rows={3} />

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <div className="mt-2 flex items-center gap-3">
              <Button type="submit" variant="accent" isLoading={isSubmitting}>
                {submitLabel}
              </Button>
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  Annuler
                </Button>
              )}
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
