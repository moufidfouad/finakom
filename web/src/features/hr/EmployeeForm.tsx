import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Employee, EmployeeInput } from "@/types";
import { getApiErrorMessage } from "@/lib/apiError";
import FormTextField from "@/components/form/FormTextField";
import FormSelectField from "@/components/form/FormSelectField";
import { Button } from "@/components/ui/button";
import {
  CONTRACT_TYPES,
  DEPARTMENTS,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
} from "./hr.constants";

// Radix Select interdit une SelectItem avec value="" (erreur au runtime) — on
// utilise donc une valeur sentinelle locale pour "Aucun manager", convertie en
// chaîne vide juste avant l'envoi (voir onSubmit plus bas). Sans option
// explicite "Aucun", il serait impossible de revenir en arrière après avoir
// choisi un manager par erreur.
const NO_MANAGER = "__NONE__";

const employeeSchema = Yup.object({
  fullName: Yup.string().trim().min(2, "Requis").required("Requis"),
  position: Yup.string().trim().min(2, "Requis").required("Requis"),
  department: Yup.string().required("Requis"),
  employmentType: Yup.string().required("Requis"),
  grossSalary: Yup.number().positive("Doit être positif").required("Requis"),
  hireDate: Yup.string().required("Requis"),
  contractType: Yup.string().required("Requis"),
  gender: Yup.string().oneOf(["M", "F"]).required(),
  city: Yup.string().optional(),
  phone: Yup.string().optional(),
  email: Yup.string().email("Email invalide").optional(),
  status: Yup.string().required(),
  workLocation: Yup.string().optional(),
  weeklyHours: Yup.number().positive("Doit être positif").optional(),
  trialPeriodMonths: Yup.number()
    .integer()
    .min(0, "Doit être positif ou nul")
    .optional(),
  contractEndDate: Yup.string().optional(),
});

const defaultValues: EmployeeInput = {
  fullName: "",
  position: "",
  department: "",
  employmentType: "Temps plein",
  grossSalary: 0,
  hireDate: "",
  contractType: "CDI",
  gender: "M",
  city: "",
  phone: "",
  email: "",
  status: "Actif",
  workLocation: "",
  weeklyHours: undefined,
  trialPeriodMonths: undefined,
  contractEndDate: "",
  managerId: "",
};

interface EmployeeFormProps {
  initialValues?: EmployeeInput;
  onSubmit: (values: EmployeeInput) => Promise<void>;
  submitLabel?: string;
  onCancel?: () => void;
  /** Employés éligibles comme manager — typiquement tous les employés de
   * l'entreprise, l'employé en cours d'édition déjà exclu par l'appelant pour
   * éviter la sélection triviale (le backend valide de toute façon les cycles). */
  managers?: Employee[];
}

export default function EmployeeForm({
  initialValues = defaultValues,
  onSubmit,
  submitLabel = "Ajouter l'employé",
  onCancel,
  managers = [],
}: EmployeeFormProps) {
  const [formError, setFormError] = useState("");
  const [showContractInfo, setShowContractInfo] = useState(
    !!(
      initialValues.workLocation ||
      initialValues.weeklyHours ||
      initialValues.trialPeriodMonths ||
      initialValues.contractEndDate
    ),
  );
  const formInitialValues = {
    ...initialValues,
    managerId: initialValues.managerId || NO_MANAGER,
  };

  return (
    <Formik
      initialValues={formInitialValues}
      validationSchema={employeeSchema}
      onSubmit={async (values, { setSubmitting }) => {
        setFormError("");
        try {
          await onSubmit({
            ...values,
            managerId: values.managerId === NO_MANAGER ? "" : values.managerId,
          });
        } catch (err) {
          setFormError(
            getApiErrorMessage(err, "Impossible d'enregistrer l'employé."),
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, values }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FormTextField
            name="fullName"
            label="Nom & prénom"
            placeholder="KOUASSI Jean"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              name="position"
              label="Poste"
              placeholder="Comptable"
            />
            <FormSelectField
              name="department"
              label="Département"
              placeholder="Sélectionner"
              options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            />
          </div>
          {managers.length > 0 && (
            <FormSelectField
              name="managerId"
              label="Supérieur hiérarchique (optionnel)"
              options={[
                { value: NO_MANAGER, label: "Aucun" },
                ...managers.map((m) => ({
                  value: m.id,
                  label: `${m.fullName} — ${m.position}`,
                })),
              ]}
            />
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormSelectField
              name="employmentType"
              label="Type de poste"
              options={EMPLOYMENT_TYPES.map((t) => ({ value: t, label: t }))}
            />
            <FormSelectField
              name="contractType"
              label="Type de contrat"
              options={CONTRACT_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              name="grossSalary"
              label="Salaire brut"
              type="number"
            />
            <FormTextField name="hireDate" label="Date d'entrée" type="date" />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <FormSelectField
              name="gender"
              label="Sexe"
              options={[
                { value: "M", label: "Homme" },
                { value: "F", label: "Femme" },
              ]}
            />
            <FormTextField name="city" label="Ville" />
            <FormSelectField
              name="status"
              label="Statut"
              options={EMPLOYEE_STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextField name="phone" label="Téléphone (optionnel)" />
            <FormTextField
              name="email"
              label="Email (optionnel)"
              type="email"
            />
          </div>

          <div className="rounded-md border border-border">
            <button
              type="button"
              onClick={() => setShowContractInfo((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
            >
              Informations contractuelles (optionnel — pour l'impression du
              contrat)
              {showContractInfo ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {showContractInfo && (
              <div className="flex flex-col gap-5 border-t border-border p-4">
                <p className="text-xs text-muted-foreground">
                  Ces informations ne servent qu'à générer le contrat de travail
                  imprimable — elles n'affectent ni la paie ni les présences.
                </p>
                <FormTextField
                  name="workLocation"
                  label="Lieu de travail"
                  placeholder="Siège social, Moroni"
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormTextField
                    name="weeklyHours"
                    label="Durée hebdomadaire (heures)"
                    type="number"
                  />
                  <FormTextField
                    name="trialPeriodMonths"
                    label="Période d'essai (mois)"
                    type="number"
                  />
                </div>
                {values.contractType?.toUpperCase().includes("CDD") && (
                  <FormTextField
                    name="contractEndDate"
                    label="Date de fin de contrat (CDD)"
                    type="date"
                  />
                )}
              </div>
            )}
          </div>

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
