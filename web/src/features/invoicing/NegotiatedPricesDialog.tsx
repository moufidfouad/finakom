import { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Plus, Trash2 } from "lucide-react";
import { Client, Product } from "@/types";
import {
  useDeleteNegotiatedPrice,
  useNegotiatedPrices,
  useUpsertNegotiatedPrice,
} from "./negotiatedPricing.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { getApiErrorMessage } from "@/lib/apiError";
import { EmptyState } from "@/components/ui/empty-state";

interface FormValues {
  productId: string;
  unitPriceHT: number;
}
const schema = Yup.object({
  productId: Yup.string().required("Sélectionnez un article"),
  unitPriceHT: Yup.number().min(0, "Doit être positif").required("Requis"),
});

export default function NegotiatedPricesDialog({
  client,
  products,
  onClose,
}: {
  client: Client;
  products: Product[];
  onClose: () => void;
}) {
  const formatAmount = useFormatAmount();
  const { data: prices } = useNegotiatedPrices(client.id);
  const upsertPrice = useUpsertNegotiatedPrice(client.id);
  const deletePrice = useDeleteNegotiatedPrice(client.id);
  const [formError, setFormError] = useState("");

  // Un seul prix négocié par article — on retire du sélecteur ceux déjà configurés,
  // pour éviter toute confusion avec la contrainte d'unicité déjà imposée côté serveur.
  const configuredProductIds = new Set((prices ?? []).map((p) => p.productId));
  const availableProducts = products.filter(
    (p) => !configuredProductIds.has(p.id),
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Prix négociés — {client.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Un prix spécifique pour un article prime toujours sur la remise
          standard du client et sur le prix catalogue.
        </p>

        {availableProducts.length > 0 && (
          <Formik
            initialValues={{ productId: "", unitPriceHT: 0 } as FormValues}
            validationSchema={schema}
            onSubmit={async (values, { resetForm, setSubmitting }) => {
              setFormError("");
              try {
                await upsertPrice.mutateAsync(values);
                resetForm();
              } catch (err) {
                setFormError(
                  getApiErrorMessage(err, "Impossible d'enregistrer ce prix."),
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ values, setFieldValue, isSubmitting }) => (
              <Form
                className="flex flex-col gap-3 border-b border-border pb-4"
                noValidate
              >
                <div className="grid grid-cols-[2fr_1fr_auto] items-end gap-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>Article</Label>
                    <Select
                      value={values.productId}
                      onValueChange={(v) => setFieldValue("productId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.code} — {p.designation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Prix HT</Label>
                    <Input
                      type="number"
                      value={values.unitPriceHT || ""}
                      onChange={(e) =>
                        setFieldValue("unitPriceHT", Number(e.target.value))
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    variant="accent"
                    isLoading={isSubmitting}
                    aria-label="Ajouter"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}
              </Form>
            )}
          </Formik>
        )}

        <div className="flex flex-col gap-2">
          {prices && prices.length === 0 && (
            <EmptyState
              message="Aucun prix négocié pour ce client."
              variant="compact"
            />
          )}
          {(prices ?? []).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">
                  {p.product.code} — {p.product.designation}
                </p>
                <p className="text-xs text-muted-foreground">
                  Catalogue : {formatAmount(Number(p.product.sellingPriceHT))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular font-medium text-accent">
                  {formatAmount(Number(p.unitPriceHT))}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deletePrice.mutate(p.id)}
                  aria-label="Retirer"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
