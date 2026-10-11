import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FormTextArea from "@/components/form/FormTextArea";
import { Button } from "@/components/ui/button";

const schema = Yup.object({
  reason: Yup.string()
    .trim()
    .min(10, "Merci de préciser le motif (10 caractères minimum)")
    .required("Le motif est requis"),
});

interface ReportConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => Promise<void>;
  isSubmitting: boolean;
}

/** Condition de lancement non négociable du cadrage stratégique — aucun
 * canal de message libre sans mécanisme minimal de signalement. */
export default function ReportConversationDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: ReportConversationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler cette conversation</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Décrivez le problème rencontré — un membre de l'équipe FINAKOM
          examinera votre signalement.
        </p>
        <Formik
          initialValues={{ reason: "" }}
          validationSchema={schema}
          onSubmit={async (values, { resetForm }) => {
            await onSubmit(values.reason);
            resetForm();
            onOpenChange(false);
          }}
        >
          {({ isSubmitting: formSubmitting }) => (
            <Form className="flex flex-col gap-4" noValidate>
              <FormTextArea
                name="reason"
                label="Motif du signalement"
                rows={4}
              />
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  isLoading={isSubmitting || formSubmitting}
                >
                  Envoyer le signalement
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}
