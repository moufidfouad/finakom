import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CreateManualEntryInput, JournalEntryLineInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { JOURNAL_TYPES } from "./accounting.constants";

function emptyLine(): JournalEntryLineInput {
  return { accountNumber: "", label: "", debit: 0, credit: 0 };
}

export default function JournalEntryForm({
  accountOptions,
  onSubmit,
  onCancel,
}: {
  accountOptions: { value: string; label: string }[];
  onSubmit: (v: CreateManualEntryInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const formatAmount = useFormatAmount();

  return (
    <Formik
      initialValues={
        {
          journal: "OD",
          date: new Date().toISOString().slice(0, 10),
          label: "",
          lines: [emptyLine(), emptyLine()],
        } as CreateManualEntryInput
      }
      validationSchema={Yup.object({
        journal: Yup.string().required(),
        date: Yup.string().required("Requis"),
        label: Yup.string().min(2, "Requis").required("Requis"),
        lines: Yup.array().min(2, "Au moins deux lignes (partie double)"),
      })}
      onSubmit={async (v, { setSubmitting }) => {
        setError("");
        try {
          await onSubmit(v);
        } catch (e) {
          setError(
            getApiErrorMessage(
              e,
              "Écriture rejetée — vérifiez l'équilibre débit/crédit.",
            ),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, values, setFieldValue }) => {
        const totalDebit = values.lines.reduce(
          (s, l) => s + (Number(l.debit) || 0),
          0,
        );
        const totalCredit = values.lines.reduce(
          (s, l) => s + (Number(l.credit) || 0),
          0,
        );
        const isBalanced = Math.round((totalDebit - totalCredit) * 100) === 0;

        return (
          <Form className="flex flex-col gap-5" noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormSelectField
                name="journal"
                label="Journal"
                options={JOURNAL_TYPES}
              />
              <FormTextField name="date" label="Date" type="date" />
            </div>
            <FormTextField
              name="label"
              label="Libellé de l'écriture"
              placeholder="Régularisation..."
            />

            <div>
              <Label>Lignes</Label>
              <FieldArray name="lines">
                {({ push, remove }) => (
                  <div className="mt-2 flex flex-col gap-3">
                    {values.lines.map((line, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_1fr_110px_110px_auto] sm:items-end"
                      >
                        <div className="flex flex-col gap-1.5">
                          <Label className="sm:hidden">Compte</Label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                            value={line.accountNumber}
                            onChange={(e) =>
                              setFieldValue(
                                `lines.${index}.accountNumber`,
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Compte…</option>
                            {accountOptions.map((a) => (
                              <option key={a.value} value={a.value}>
                                {a.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="sm:hidden">
                            Libellé (optionnel)
                          </Label>
                          <input
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                            placeholder="Libellé (optionnel)"
                            value={line.label ?? ""}
                            onChange={(e) =>
                              setFieldValue(
                                `lines.${index}.label`,
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="sm:hidden">Débit</Label>
                          <input
                            type="number"
                            placeholder="Débit"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                            value={line.debit || ""}
                            onChange={(e) => {
                              setFieldValue(
                                `lines.${index}.debit`,
                                Number(e.target.value),
                              );
                              if (Number(e.target.value) > 0)
                                setFieldValue(`lines.${index}.credit`, 0);
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="sm:hidden">Crédit</Label>
                          <input
                            type="number"
                            placeholder="Crédit"
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                            value={line.credit || ""}
                            onChange={(e) => {
                              setFieldValue(
                                `lines.${index}.credit`,
                                Number(e.target.value),
                              );
                              if (Number(e.target.value) > 0)
                                setFieldValue(`lines.${index}.debit`, 0);
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            values.lines.length > 2 && remove(index)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
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
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-4 py-3">
              <div className="flex gap-6 text-sm">
                <span>
                  Débit :{" "}
                  <strong className="tabular">
                    {formatAmount(totalDebit)}
                  </strong>
                </span>
                <span>
                  Crédit :{" "}
                  <strong className="tabular">
                    {formatAmount(totalCredit)}
                  </strong>
                </span>
              </div>
              <Badge variant={isBalanced ? "success" : "destructive"}>
                {isBalanced ? "✅ Équilibrée" : "⚠️ Déséquilibrée"}
              </Badge>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button
                type="submit"
                variant="accent"
                isLoading={isSubmitting}
                disabled={!isBalanced}
              >
                Enregistrer l'écriture
              </Button>
              <Button type="button" variant="ghost" onClick={onCancel}>
                Annuler
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
}
