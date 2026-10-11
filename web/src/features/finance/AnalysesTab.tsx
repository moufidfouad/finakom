import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, LineChart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useAnalyses, useCreateAnalysis } from "./analyses.api";
import AnalysisForm from "./AnalysisForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { LoadingState } from "@/components/ui/loading-state";

export default function AnalysesTab({ companyId }: { companyId: string }) {
  const { data: analyses, isLoading } = useAnalyses(companyId);
  const createAnalysis = useCreateAnalysis(companyId);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {analyses ? `${analyses.length} analyse(s)` : "Chargement…"}
        </p>
        <Button variant="accent" size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Nouvelle analyse
        </Button>
      </div>

      <div className="mt-4">
        {isLoading && <LoadingState />}

        {analyses && analyses.length === 0 && (
          <EmptyState
            icon={LineChart}
            message="Aucune analyse pour le moment. Créez-en une pour importer une balance comptable."
          />
        )}

        {analyses && analyses.length > 0 && (
          <div className="space-y-2">
            {analyses.map((a) => (
              <Link key={a.id} to={`/app/analyses/${a.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-foreground">{a.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Clôture : {formatDate(a.exerciceNDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular text-xs text-muted-foreground">
                        {a._count?.balanceLines ?? 0} lignes
                      </span>
                      <Badge
                        variant={
                          a.status === "completed" ? "success" : "secondary"
                        }
                      >
                        {a.status === "completed" ? "Terminée" : "Brouillon"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle analyse</DialogTitle>
          </DialogHeader>
          <AnalysisForm
            onSubmit={async (values) => {
              await createAnalysis.mutateAsync(values);
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
