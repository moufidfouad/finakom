import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import {
  useInvoicingSettings,
  useUpdateInvoicingSettings,
  InvoicingSettingsInput,
} from "./settings.api";
import CompanyLogoCard from "@/features/companies/CompanyLogoCard";
import DirectorySettingsCard from "@/features/companies/DirectorySettingsCard";
import { LoadingState } from "@/components/ui/loading-state";
import FormTextField from "@/components/form/FormTextField";
import FormTextArea from "@/components/form/FormTextArea";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/apiError";

const schema = Yup.object({
  tvaRatePercent: Yup.number().min(0).max(100),
  quoteValidityDays: Yup.number().integer().positive(),
  paymentTermsDays: Yup.number().integer().positive(),
  latePenaltyRatePercent: Yup.number().min(0),
  cashDiscountRatePercent: Yup.number().min(0),
});

export default function SettingsTab({ companyId }: { companyId: string }) {
  const { data: settings, isLoading } = useInvoicingSettings(companyId);
  const updateSettings = useUpdateInvoicingSettings(companyId);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  if (isLoading || !settings) return <LoadingState />;

  const initialValues: InvoicingSettingsInput = {
    tvaRatePercent: Number(settings.tvaRatePercent),
    quoteValidityDays: settings.quoteValidityDays,
    paymentTermsDays: settings.paymentTermsDays,
    latePenaltyRatePercent: Number(settings.latePenaltyRatePercent),
    cashDiscountRatePercent: Number(settings.cashDiscountRatePercent),
    vatMention: settings.vatMention ?? "",
    paymentConditions: settings.paymentConditions ?? "",
    deliveryConditions: settings.deliveryConditions ?? "",
    legalMention: settings.legalMention ?? "",
    warranty: settings.warranty ?? "",
    bankDetails: settings.bankDetails ?? "",
  };

  return (
    <div className="max-w-2xl">
      <CompanyLogoCard companyId={companyId} />
      <DirectorySettingsCard companyId={companyId} />

      <p className="mt-6 text-sm text-muted-foreground">
        Ces paramètres s'appliquent aux nouveaux documents. Le taux de TVA est
        figé sur chaque document au moment de sa création : le modifier ici
        n'affecte pas les documents déjà émis.
      </p>

      <Formik
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          setFormError("");
          setSuccess(false);
          try {
            await updateSettings.mutateAsync(values);
            setSuccess(true);
          } catch (err) {
            setFormError(
              getApiErrorMessage(
                err,
                "Impossible de sauvegarder les paramètres.",
              ),
            );
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="mt-6 flex flex-col gap-5" noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormTextField
                name="tvaRatePercent"
                label="Taux de TVA (%)"
                type="number"
              />
              <FormTextField
                name="quoteValidityDays"
                label="Validité des devis (jours)"
                type="number"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormTextField
                name="paymentTermsDays"
                label="Délai de paiement (jours)"
                type="number"
              />
              <FormTextField
                name="latePenaltyRatePercent"
                label="Pénalité de retard (%/mois)"
                type="number"
              />
            </div>
            <FormTextField
              name="cashDiscountRatePercent"
              label="Escompte paiement comptant (%)"
              type="number"
            />
            <FormTextField
              name="vatMention"
              label="Mention TVA"
              placeholder="Ex : TVA 18% incluse"
            />
            <FormTextArea
              name="paymentConditions"
              label="Conditions de paiement"
              rows={2}
            />
            <FormTextArea
              name="deliveryConditions"
              label="Conditions de livraison"
              rows={2}
            />
            <FormTextArea
              name="legalMention"
              label="Mention légale facture"
              rows={2}
            />
            <FormTextField name="warranty" label="Garantie" />
            <FormTextArea name="bankDetails" label="Banque / RIB" rows={2} />

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            {success && (
              <p className="text-sm text-success">✓ Paramètres enregistrés.</p>
            )}

            <Button
              type="submit"
              variant="accent"
              isLoading={isSubmitting}
              className="self-start"
            >
              Enregistrer les paramètres
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
