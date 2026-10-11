import { useState } from "react";
import { NarrativeSections } from "@/types";
import { useUpdateBusinessPlan } from "./plan.api";
import { NARRATIVE_SECTION_FIELDS } from "./businessPlan.constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "@/components/form/RichTextEditor";

export default function NarrativeTab({
  planId,
  companyId,
  canEdit,
  sections,
}: {
  planId: string;
  companyId: string;
  canEdit: boolean;
  sections: NarrativeSections | null;
}) {
  const updatePlan = useUpdateBusinessPlan(companyId);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  function valueFor(key: keyof NarrativeSections): string {
    return drafts[key] ?? sections?.[key] ?? "";
  }

  async function save(key: keyof NarrativeSections) {
    setSavingKey(key);
    try {
      await updatePlan.mutateAsync({
        id: planId,
        input: { narrativeSections: { [key]: valueFor(key) } },
      });
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {NARRATIVE_SECTION_FIELDS.map((field) => (
        <Card key={field.key}>
          <CardHeader>
            <CardTitle className="text-base">{field.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={valueFor(field.key)}
              placeholder={field.placeholder}
              disabled={!canEdit}
              onChange={(html) =>
                setDrafts((d) => ({ ...d, [field.key]: html }))
              }
            />
            {canEdit && (
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={savingKey === field.key}
                  onClick={() => save(field.key)}
                >
                  Enregistrer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
