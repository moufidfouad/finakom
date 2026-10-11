import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { FixedAssetInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import  FormTextField  from "@/components/form/FormTextField";
import  FormSelectField  from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import {
  ASSET_CATEGORIES,
  DEPRECIATION_METHODS,
} from "./fixedAssets.constants";

const schema = Yup.object({
  accountNumber: Yup.string().trim().min(2, "Requis").required("Requis"),
  designation: Yup.string().trim().min(2, "Requis").required("Requis"),
  category: Yup.string().required("Requis"),
  acquisitionDate: Yup.string().required("Requis"),
  method: Yup.string().required("Requis"),
  durationYears: Yup.number().when("method", {
    is: (m: string) => m !== "Non amortissable",
    then: (s) =>
      s.positive("La durée est requise").required("La durée est requise"),
  }),
  grossValue: Yup.number()
    .positive("La valeur brute doit être positive")
    .required("Requis"),
});

const defaultValues: FixedAssetInput = {
  accountNumber: "",
  acquisitionDate: "",
  designation: "",
  category: "",
  location: "",
  method: "Linéaire",
  durationYears: undefined,
  grossValue: 0,
  notes: "",
};

interface AssetFormProps {
  initialValues?: FixedAssetInput;
  onSubmit: (values: FixedAssetInput) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function AssetForm({
  initialValues = defaultValues,
  onSubmit,
  submitLabel = "Ajouter l'immobilisation",
  onCancel,
}: AssetFormProps) {
  const [formError, setFormError] = useState("");

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await onSubmit(values);
        } catch (err) {
          setFormError(
            getApiErrorMessage(
              err,
              "Impossible d'enregistrer l'immobilisation.",
            ),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, values }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FormTextField
            name="designation"
            label="Désignation"
            placeholder="Véhicule de service"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormSelectField
              name="category"
              label="Catégorie"
              placeholder="Sélectionner"
              options={ASSET_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <FormTextField
              name="accountNumber"
              label="N° compte SYSCOHADA"
              placeholder="244"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              name="acquisitionDate"
              label="Date d'acquisition"
              type="date"
            />
            <FormTextField name="location" label="Localisation (optionnel)" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormSelectField
              name="method"
              label="Méthode d'amortissement"
              options={DEPRECIATION_METHODS.map((m) => ({
                value: m,
                label: m,
              }))}
            />
            {values.method !== "Non amortissable" && (
              <FormTextField
                name="durationYears"
                label="Durée (années)"
                type="number"
              />
            )}
          </div>
          <FormTextField
            name="grossValue"
            label="Valeur brute d'origine"
            type="number"
          />
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
