import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { AssetMovementInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import  FormTextField  from "@/components/form/FormTextField";
import  FormSelectField  from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import { MOVEMENT_TYPES } from "./fixedAssets.constants";

const schema = Yup.object({
  date: Yup.string().required("Requis"),
  designation: Yup.string().trim().min(2, "Requis").required("Requis"),
  type: Yup.string().required("Requis"),
});

const initialValues: AssetMovementInput = {
  date: "",
  pieceNumber: "",
  designation: "",
  type: "Cession",
  amount: 0,
  disposalPrice: 0,
  notes: "",
};

export default function MovementForm({
  assetDesignation,
  onSubmit,
  onCancel,
}: {
  assetDesignation: string;
  onSubmit: (values: AssetMovementInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [formError, setFormError] = useState("");

  return (
    <Formik
      initialValues={{ ...initialValues, designation: assetDesignation }}
      validationSchema={schema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await onSubmit(values);
        } catch (err) {
          setFormError(
            getApiErrorMessage(err, "Impossible d'enregistrer le mouvement."),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, values }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FormSelectField
            name="type"
            label="Type de mouvement"
            options={MOVEMENT_TYPES.map((t) => ({ value: t, label: t }))}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextField name="date" label="Date" type="date" />
            <FormTextField name="pieceNumber" label="N° pièce (optionnel)" />
          </div>
          <FormTextField name="designation" label="Désignation" />
          {values.type !== "Cession" && (
            <FormTextField name="amount" label="Montant" type="number" />
          )}
          {values.type === "Cession" && (
            <FormTextField
              name="disposalPrice"
              label="Prix de cession"
              type="number"
              hint="La plus/moins-value sera calculée automatiquement à partir de la VNC à cette date."
            />
          )}
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="mt-2 flex items-center gap-3">
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Enregistrer
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
