import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import { Plus, Trash2 } from "lucide-react";
import { JobPostingInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import FormTextField from "@/components/form/FormTextField";
import FormTextArea from "@/components/form/FormTextArea";
import FormSelectField from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CONTRACT_TYPES } from "./jobPostings.constants";
import { CV_SKILL_LEVELS } from "@/features/cv/cv.constants";

const skillSchema = Yup.object({
  title: Yup.string().trim().min(1, "Requis").required("Requis"),
  level: Yup.string().oneOf(CV_SKILL_LEVELS).required("Requis"),
});

const schema = Yup.object({
  title: Yup.string()
    .trim()
    .min(2, "L'intitulé du poste est requis")
    .required("L'intitulé du poste est requis"),
  description: Yup.string()
    .trim()
    .min(10, "La description est requise")
    .required("La description est requise"),
  location: Yup.string().trim().optional(),
  contractType: Yup.string()
    .trim()
    .min(2, "Le type de contrat est requis")
    .required("Le type de contrat est requis"),
  desiredExperienceYears: Yup.number().min(0).max(60).optional(),
  desiredSkills: Yup.array().of(skillSchema),
});

interface JobPostingFormProps {
  initialValues?: JobPostingInput;
  submitLabel: string;
  onSubmit: (input: JobPostingInput) => Promise<void>;
  onCancel: () => void;
}

const defaultValues: JobPostingInput = {
  title: "",
  description: "",
  location: "",
  contractType: "",
  desiredExperienceYears: undefined,
  desiredSkills: [],
};

export default function JobPostingForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: JobPostingFormProps) {
  return (
    <Formik
      initialValues={initialValues ?? defaultValues}
      validationSchema={schema}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        try {
          await onSubmit(values);
        } catch (err) {
          setStatus(
            getApiErrorMessage(err, "Impossible d'enregistrer l'offre."),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, isSubmitting, status }) => (
        <Form className="flex flex-col gap-4" noValidate>
          <FormTextField
            name="title"
            label="Intitulé du poste"
            placeholder="ex: Comptable senior"
          />
          <FormTextArea name="description" label="Description" rows={5} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormTextField
              name="location"
              label="Lieu (optionnel)"
              placeholder="ex: Moroni, Comores"
            />
            <FormSelectField
              name="contractType"
              label="Type de contrat"
              placeholder="Sélectionner"
              options={CONTRACT_TYPES.map((c) => ({ value: c, label: c }))}
            />
          </div>
          <FormTextField
            name="desiredExperienceYears"
            label="Expérience souhaitée (années, optionnel)"
            type="number"
            placeholder="ex: 3"
          />

          <div>
            <Label>Compétences souhaitées (optionnel)</Label>
            <FieldArray name="desiredSkills">
              {({ push, remove }) => (
                <div className="mt-2 flex flex-col gap-3">
                  {values.desiredSkills.map((_, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
                    >
                      <div className="flex flex-col gap-1.5">
                        <Label className="sm:hidden">Compétence</Label>
                        <FormTextField
                          name={`desiredSkills.${index}.title`}
                          label=""
                          placeholder="ex: SYSCOHADA"
                        />
                      </div>
                      <FormSelectField
                        name={`desiredSkills.${index}.level`}
                        label=""
                        placeholder="Niveau"
                        options={CV_SKILL_LEVELS.map((l) => ({
                          value: l,
                          label: l,
                        }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => push({ title: "", level: "Débutant" })}
                  >
                    <Plus className="h-4 w-4" /> Ajouter une compétence
                  </Button>
                </div>
              )}
            </FieldArray>
          </div>

          {status && <p className="text-sm text-destructive">{status}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              {submitLabel}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
