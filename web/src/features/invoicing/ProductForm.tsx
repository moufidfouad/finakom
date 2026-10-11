import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { ProductInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from "./invoicing.constants";

const productSchema = Yup.object({
  designation: Yup.string()
    .trim()
    .min(2, "La désignation est requise")
    .required("Requis"),
  unit: Yup.string().required("L'unité est requise"),
  category: Yup.string().required("La catégorie est requise"),
  sellingPriceHT: Yup.number()
    .positive("Le prix doit être positif")
    .required("Requis"),
  unitCost: Yup.number().min(0).optional(),
  trackInventory: Yup.boolean(),
  stockMin: Yup.number().min(0).optional(),
  stockInitial: Yup.number().min(0).optional(),
});

const defaultValues: ProductInput = {
  designation: "",
  unit: "Unité",
  category: "",
  sellingPriceHT: 0,
  unitCost: 0,
  trackInventory: false,
  stockMin: 0,
  stockInitial: 0,
};

interface ProductFormProps {
  initialValues?: ProductInput;
  onSubmit: (values: ProductInput) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function ProductForm({
  initialValues = defaultValues,
  onSubmit,
  submitLabel = "Ajouter l'article",
  onCancel,
}: ProductFormProps) {
  const [formError, setFormError] = useState("");

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={productSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await onSubmit(values);
        } catch (err) {
          setFormError(
            getApiErrorMessage(err, "Impossible d'enregistrer l'article."),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, values, setFieldValue }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FormTextField
            name="designation"
            label="Désignation"
            placeholder="Ordinateur portable HP ProBook"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormSelectField
              name="unit"
              label="Unité"
              options={PRODUCT_UNITS.map((u) => ({ value: u, label: u }))}
            />
            <FormSelectField
              name="category"
              label="Catégorie"
              placeholder="Sélectionner"
              options={PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              name="sellingPriceHT"
              label="Prix de vente HT"
              type="number"
            />
            <FormTextField
              name="unitCost"
              label="Coût de revient (optionnel)"
              type="number"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.trackInventory}
              onChange={(e) =>
                setFieldValue("trackInventory", e.target.checked)
              }
              className="h-4 w-4 rounded border-input"
            />
            Suivre cet article en inventaire (stock)
          </label>

          {values.trackInventory && (
            <div className="grid gap-5 sm:grid-cols-2">
              <FormTextField
                name="stockInitial"
                label="Stock initial"
                type="number"
              />
              <FormTextField
                name="stockMin"
                label="Stock minimum (alerte)"
                type="number"
              />
            </div>
          )}

          {formError && <p className="text-sm text-destructive">{formError}</p>}
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
      )}
    </Formik>
  );
}
