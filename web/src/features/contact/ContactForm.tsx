import { Formik, Form } from "formik";
import * as Yup from "yup";
import FormTextField from "@/components/form/FormTextField";
import FormTextArea from "@/components/form/FormTextArea";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/apiError";
import { useSubmitContact, ContactInput } from "./contact.api";

const contactSchema = Yup.object({
  fullName: Yup.string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .required("Le nom est requis"),
  email: Yup.string()
    .trim()
    .email("Email invalide")
    .required("L'email est requis"),
  subject: Yup.string()
    .trim()
    .min(3, "Le sujet est requis")
    .required("Le sujet est requis"),
  message: Yup.string()
    .trim()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .required("Le message est requis"),
  website: Yup.string().max(0),
});

const initialValues: ContactInput = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

export default function ContactForm() {
  const submitContact = useSubmitContact();

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={contactSchema}
      onSubmit={async (values, { resetForm, setSubmitting }) => {
        try {
          await submitContact.mutateAsync(values);
          resetForm();
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website">Ne pas remplir</label>
            <input
              type="text"
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              name="fullName"
              label="Nom complet"
              placeholder="Votre nom"
              autoComplete="name"
            />
            <FormTextField
              name="email"
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              autoComplete="email"
            />
          </div>
          <FormTextField
            name="subject"
            label="Sujet"
            placeholder="Objet de votre message"
          />
          <FormTextArea
            name="message"
            label="Message"
            rows={6}
            placeholder="Comment pouvons-nous vous aider ?"
          />

          {submitContact.isSuccess && (
            <p className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              ✓ Votre message a bien été envoyé. Nous vous répondrons
              rapidement.
            </p>
          )}
          {submitContact.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {getApiErrorMessage(
                submitContact.error,
                "L'envoi a échoué. Merci de réessayer.",
              )}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            variant="accent"
            isLoading={isSubmitting}
            className="self-start"
          >
            Envoyer le message
          </Button>
        </Form>
      )}
    </Formik>
  );
}
