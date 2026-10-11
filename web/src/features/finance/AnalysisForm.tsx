import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { AnalysisInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import  FormTextField  from "@/components/form/FormTextField";
import { Button } from "@/components/ui/button";

const schema = Yup.object({
  label: Yup.string().trim().min(2, "Requis").required("Requis"),
  exerciceNDate: Yup.string().required("Requis"),
  exerciceN1Date: Yup.string().optional(),
  analystName: Yup.string().optional(),
});

export default function AnalysisForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: AnalysisInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [formError, setFormError] = useState("");

  return (
    <Formik
      initialValues={{
        label: "",
        exerciceNDate: "",
        exerciceN1Date: "",
        analystName: "",
      }}
      validationSchema={schema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await onSubmit(values);
        } catch (err) {
          setFormError(
            getApiErrorMessage(err, "Impossible de créer l'analyse."),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FormTextField
            name="label"
            label="Libellé de l'analyse"
            placeholder="Ex : Exercice 2025"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              name="exerciceNDate"
              label="Clôture exercice N"
              type="date"
            />
            <FormTextField
              name="exerciceN1Date"
              label="Clôture exercice N-1 (optionnel)"
              type="date"
            />
          </div>
          <FormTextField name="analystName" label="Analyste (optionnel)" />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="mt-2 flex items-center gap-3">
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Créer l'analyse
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
