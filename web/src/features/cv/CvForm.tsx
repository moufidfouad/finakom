import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";
import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Cv, CvInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import FormTextField from "@/components/form/FormTextField";
import FormTextArea from "@/components/form/FormTextArea";
import FormSelectField from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CV_SKILL_LEVELS } from "./cv.constants";

const educationSchema = Yup.object({
  degree: Yup.string().trim().min(2, "Requis").required("Requis"),
  school: Yup.string().trim().min(2, "Requis").required("Requis"),
  startYear: Yup.number().min(1950).max(2100).required("Requis"),
  endYear: Yup.number().min(1950).max(2100).nullable(),
});

const experienceSchema = Yup.object({
  title: Yup.string().trim().min(2, "Requis").required("Requis"),
  company: Yup.string().trim().min(2, "Requis").required("Requis"),
  startDate: Yup.string().required("Requis"),
  endDate: Yup.string().nullable(),
  description: Yup.string().max(2000),
});

const skillSchema = Yup.object({
  title: Yup.string().trim().min(1, "Requis").required("Requis"),
  level: Yup.string().oneOf(CV_SKILL_LEVELS).required("Requis"),
  specificities: Yup.array().of(Yup.string()),
});

const languageSchema = Yup.object({
  name: Yup.string().trim().min(1, "Requis").required("Requis"),
  level: Yup.string().oneOf(CV_SKILL_LEVELS).required("Requis"),
});

const cvSchema = Yup.object({
  title: Yup.string()
    .trim()
    .min(2, "L'intitulé recherché est requis")
    .required("L'intitulé recherché est requis"),
  summary: Yup.string().max(2000),
  educations: Yup.array().of(educationSchema),
  experiences: Yup.array().of(experienceSchema),
  skills: Yup.array().of(skillSchema),
  languages: Yup.array().of(languageSchema),
  permits: Yup.array().of(Yup.string()),
  interests: Yup.array().of(Yup.string()),
});

interface CvFormProps {
  initialCv?: Cv;
  onSubmit: (input: CvInput) => Promise<void>;
  onCancel: () => void;
}

/**
 * Liste de tags éditable (permis, centres d'intérêt) — saisie libre "à
 * volonté" via un champ texte + Entrée, plutôt qu'un FieldArray d'objets :
 * chaque entrée n'est qu'un libellé, pas de structure à éditer par ligne.
 */
function TagListField({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function addTag() {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setDraft("");
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((tag, index) => (
          <Badge key={index} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="rounded-full p-0.5 hover:bg-secondary-foreground/10"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>
    </div>
  );
}

export default function CvForm({ initialCv, onSubmit, onCancel }: CvFormProps) {
  const initialValues: CvInput = {
    title: initialCv?.title ?? "",
    summary: initialCv?.summary ?? "",
    educations:
      initialCv?.educations.map((e) => ({
        degree: e.degree,
        school: e.school,
        startYear: e.startYear,
        endYear: e.endYear,
      })) ?? [],
    experiences:
      initialCv?.experiences.map((e) => ({
        title: e.title,
        company: e.company,
        startDate: e.startDate.slice(0, 10),
        endDate: e.endDate?.slice(0, 10) ?? null,
        description: e.description ?? "",
      })) ?? [],
    skills:
      initialCv?.skills.map((s) => ({
        title: s.title,
        level: s.level,
        specificities: s.specificities,
      })) ?? [],
    languages:
      initialCv?.languages.map((l) => ({ name: l.name, level: l.level })) ?? [],
    permits: initialCv?.permits ?? [],
    interests: initialCv?.interests ?? [],
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={cvSchema}
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        try {
          await onSubmit(values);
        } catch (err) {
          setStatus(getApiErrorMessage(err, "Impossible d'enregistrer le CV."));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ values, isSubmitting, status, setFieldValue }) => (
        <Form className="flex flex-col gap-6" noValidate>
          <FormTextField
            name="title"
            label="Intitulé recherché"
            placeholder="ex: Comptable senior"
          />
          <FormTextArea name="summary" label="Résumé (optionnel)" rows={3} />

          <div>
            <Label>Compétences</Label>
            <FieldArray name="skills">
              {({ push, remove }) => (
                <div className="mt-2 flex flex-col gap-3">
                  {values.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 rounded-md border border-border p-3"
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
                        <div className="flex flex-col gap-1.5">
                          <Label className="sm:hidden">Compétence</Label>
                          <FormTextField
                            name={`skills.${index}.title`}
                            label=""
                            placeholder="ex: Comptabilité"
                          />
                        </div>
                        <FormSelectField
                          name={`skills.${index}.level`}
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
                      <TagListField
                        label="Spécificités acquises (optionnel)"
                        values={skill.specificities}
                        onChange={(v) =>
                          setFieldValue(`skills.${index}.specificities`, v)
                        }
                        placeholder="ex: Clôtures annuelles"
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() =>
                      push({ title: "", level: "Débutant", specificities: [] })
                    }
                  >
                    <Plus className="h-4 w-4" /> Ajouter une compétence
                  </Button>
                </div>
              )}
            </FieldArray>
          </div>

          <div>
            <Label>Langues</Label>
            <FieldArray name="languages">
              {({ push, remove }) => (
                <div className="mt-2 flex flex-col gap-3">
                  {values.languages.map((_, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
                    >
                      <div className="flex flex-col gap-1.5">
                        <Label className="sm:hidden">Langue</Label>
                        <FormTextField
                          name={`languages.${index}.name`}
                          label=""
                          placeholder="ex: Anglais"
                        />
                      </div>
                      <FormSelectField
                        name={`languages.${index}.level`}
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
                    onClick={() => push({ name: "", level: "Débutant" })}
                  >
                    <Plus className="h-4 w-4" /> Ajouter une langue
                  </Button>
                </div>
              )}
            </FieldArray>
          </div>

          <TagListField
            label="Permis (optionnel)"
            values={values.permits}
            onChange={(v) => setFieldValue("permits", v)}
            placeholder="ex: Permis B"
          />

          <TagListField
            label="Centres d'intérêt (optionnel)"
            values={values.interests}
            onChange={(v) => setFieldValue("interests", v)}
            placeholder="ex: Randonnée"
          />

          <div>
            <Label>Formations</Label>
            <FieldArray name="educations">
              {({ push, remove }) => (
                <div className="mt-2 flex flex-col gap-3">
                  {values.educations.map((_, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-[2fr_2fr_1fr_1fr_auto] sm:items-end"
                    >
                      <div className="flex flex-col gap-1.5">
                        <Label className="sm:hidden">Diplôme</Label>
                        <FormTextField
                          name={`educations.${index}.degree`}
                          label=""
                          placeholder="Diplôme"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="sm:hidden">Établissement</Label>
                        <FormTextField
                          name={`educations.${index}.school`}
                          label=""
                          placeholder="Établissement"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="sm:hidden">Début</Label>
                        <FormTextField
                          name={`educations.${index}.startYear`}
                          label=""
                          type="number"
                          placeholder="Début"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="sm:hidden">Fin</Label>
                        <FormTextField
                          name={`educations.${index}.endYear`}
                          label=""
                          type="number"
                          placeholder="Fin (ou vide)"
                        />
                      </div>
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
                    onClick={() =>
                      push({
                        degree: "",
                        school: "",
                        startYear: new Date().getFullYear(),
                        endYear: null,
                      })
                    }
                  >
                    <Plus className="h-4 w-4" /> Ajouter une formation
                  </Button>
                </div>
              )}
            </FieldArray>
          </div>

          <div>
            <Label>Expériences</Label>
            <FieldArray name="experiences">
              {({ push, remove }) => (
                <div className="mt-2 flex flex-col gap-3">
                  {values.experiences.map((_, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 rounded-md border border-border p-3"
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_2fr_1fr_1fr_auto] sm:items-end">
                        <FormTextField
                          name={`experiences.${index}.title`}
                          label=""
                          placeholder="Poste"
                        />
                        <FormTextField
                          name={`experiences.${index}.company`}
                          label=""
                          placeholder="Entreprise"
                        />
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs">Début</Label>
                          <Input
                            type="date"
                            value={values.experiences[index].startDate}
                            onChange={(e) =>
                              setFieldValue(
                                `experiences.${index}.startDate`,
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs">Fin (ou vide)</Label>
                          <Input
                            type="date"
                            value={values.experiences[index].endDate ?? ""}
                            onChange={(e) =>
                              setFieldValue(
                                `experiences.${index}.endDate`,
                                e.target.value || null,
                              )
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <FormTextArea
                        name={`experiences.${index}.description`}
                        label="Description (optionnel)"
                        rows={2}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() =>
                      push({
                        title: "",
                        company: "",
                        startDate: new Date().toISOString().slice(0, 10),
                        endDate: null,
                        description: "",
                      })
                    }
                  >
                    <Plus className="h-4 w-4" /> Ajouter une expérience
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
              Enregistrer
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
