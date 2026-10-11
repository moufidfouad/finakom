import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { CompanyInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import {
  ACCOUNTING_SYSTEMS,
  CURRENCIES,
  FISCAL_REGIMES,
  OHADA_COUNTRIES,
  SECTORS,
} from "./companies.constants";

const companySchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, "Le nom de l'entreprise est requis")
    .required("Le nom est requis"),
  country: Yup.string().required("Le pays est requis"),
  currency: Yup.string().required("La devise est requise"),
  sector: Yup.string().required("Le secteur d'activité est requis"),
  accountingSystem: Yup.string().oneOf(["Normal", "SMT"]).required(),
  fiscalRegime: Yup.string().required("Le régime fiscal est requis"),
});

const defaultValues: CompanyInput = {
  name: "",
  country: "Comores",
  currency: "KMF",
  sector: "",
  address: "",
  accountingSystem: "Normal",
  fiscalRegime: "",
};

interface CompanyFormProps {
  initialValues?: CompanyInput;
  onSubmit: (values: CompanyInput) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function CompanyForm({
  initialValues = defaultValues,
  onSubmit,
  submitLabel = "Créer l'entreprise",
  onCancel,
}: CompanyFormProps) {
  const [formError, setFormError] = useState("");

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={companySchema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await onSubmit(values);
        } catch (err) {
          setFormError(
            getApiErrorMessage(err, "Impossible d'enregistrer l'entreprise."),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FormTextField
            name="name"
            label="Nom de l'entreprise"
            placeholder="Ex : SARL Alpha Distribution"
          />
          <FormTextField
            name="address"
            label="Adresse (optionnel)"
            placeholder="Ex : Rue du Commerce, Bazmini"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormSelectField
              name="sector"
              label="Secteur d'activité"
              placeholder="Sélectionner"
              options={SECTORS.map((s) => ({ value: s, label: s }))}
            />
            <FormSelectField
              name="country"
              label="Pays"
              options={OHADA_COUNTRIES.map((c) => ({ value: c, label: c }))}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormSelectField
              name="currency"
              label="Devise"
              options={CURRENCIES}
            />
            <FormSelectField
              name="fiscalRegime"
              label="Régime fiscal"
              placeholder="Sélectionner"
              options={FISCAL_REGIMES.map((r) => ({ value: r, label: r }))}
            />
          </div>
          <FormSelectField
            name="accountingSystem"
            label="Système comptable"
            options={ACCOUNTING_SYSTEMS}
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
