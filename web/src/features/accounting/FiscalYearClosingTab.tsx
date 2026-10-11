import { useState } from "react";
import { AlertTriangle, Lock, LockOpen } from "lucide-react";
import { useCloseFiscalYear, useFiscalYears } from "./fiscalYearClosing.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { formatDate } from "@/lib/format";
import { LoadingState } from "@/components/ui/loading-state";

const currentYear = new Date().getFullYear();

export default function FiscalYearClosingTab({
  companyId,
}: {
  companyId: string;
}) {
  const formatAmount = useFormatAmount();
  const { data: closings, isLoading } = useFiscalYears(companyId);
  const closeFiscalYear = useCloseFiscalYear(companyId);
  const [confirmYear, setConfirmYear] = useState<number | null>(null);

  const closedYears = new Set((closings ?? []).map((c) => c.fiscalYear));
  // Propose les 3 dernières années non encore clôturées — pas la peine
  // d'afficher un choix illimité, une entreprise clôture rarement autre chose
  // que l'exercice précédent ou l'exercice en cours.
  const candidateYears = [currentYear - 2, currentYear - 1, currentYear].filter(
    (y) => !closedYears.has(y),
  );

  return (
    <div>
      <div className="rounded-md border border-border bg-secondary/40 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-accent" /> Action irréversible
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Clôturer un exercice verrouille définitivement toutes ses écritures
          (aucune création, modification ou suppression n'y sera plus possible)
          et génère automatiquement l'écriture qui solde les comptes de charges
          et de produits vers le résultat net de l'exercice.
        </p>
      </div>

      {candidateYears.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {candidateYears.map((year) => (
            <Button
              key={year}
              variant="outline"
              size="sm"
              onClick={() => setConfirmYear(year)}
            >
              <Lock className="h-4 w-4" /> Clôturer l'exercice {year}
            </Button>
          ))}
        </div>
      )}

      <div className="mt-6">
        {isLoading && <LoadingState />}
        {closings && closings.length === 0 && (
          <EmptyState
            icon={LockOpen}
            message="Aucun exercice clôturé — tous les exercices sont actuellement ouverts."
          />
        )}
        {closings && closings.length > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercice</TableHead>
                  <TableHead>Résultat net</TableHead>
                  <TableHead>Clôturé par</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closings.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.fiscalYear}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          Number(c.netResult) >= 0 ? "success" : "destructive"
                        }
                      >
                        {Number(c.netResult) >= 0 ? "Bénéfice" : "Perte"} —{" "}
                        {formatAmount(Math.abs(Number(c.netResult)))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.closedBy
                        ? c.closedBy.fullName || c.closedBy.email
                        : "Utilisateur supprimé"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(c.closedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Dialog
        open={confirmYear !== null}
        onOpenChange={(o) => !o && setConfirmYear(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clôturer l'exercice {confirmYear} ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cette action est <strong>définitive</strong>. Toutes les écritures
            de l'exercice {confirmYear} seront verrouillées — plus aucune
            création, modification ou suppression n'y sera possible, y compris
            par un administrateur. Le résultat net sera calculé et comptabilisé
            automatiquement.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="destructive"
              isLoading={closeFiscalYear.isPending}
              onClick={async () => {
                if (confirmYear !== null) {
                  await closeFiscalYear.mutateAsync(confirmYear);
                  setConfirmYear(null);
                }
              }}
            >
              Confirmer la clôture
            </Button>
            <Button variant="ghost" onClick={() => setConfirmYear(null)}>
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
