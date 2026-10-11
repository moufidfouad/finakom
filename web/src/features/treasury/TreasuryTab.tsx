import { useState } from "react";
import {
  AlertTriangle,
  Landmark,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatCard } from "@/components/ui/stat-card";
import { TreasuryEntry, TreasuryEntryInput } from "@/types";
import {
  useCreateTreasuryEntry,
  useDeleteTreasuryEntry,
  useTreasuryEntries,
  useUpdateTreasuryEntry,
} from "./entries.api";
import { useTreasuryDashboard } from "./dashboard.api";
import EntryForm from "./EntryForm";
import SignalBadge from "./SignalBadge";
import MonthlyBalanceChart from "@/components/common/charts/MonthlyBalanceChart";
import { useCompanyPermissions } from "@/features/companies/useCompanyPermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/format";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { MONTH_LABELS } from "./treasury.constants";
import ReconciliationTab from "./ReconciliationTab";
import { LoadingState } from "@/components/ui/loading-state";

function TreasuryJournalTab({ companyId }: { companyId: string }) {
  const formatAmount = useFormatAmount();
  const fiscalYear = new Date().getFullYear();
  const { data: entries, isLoading } = useTreasuryEntries(companyId);
  const { data: dashboard } = useTreasuryDashboard(companyId, fiscalYear);
  const createEntry = useCreateTreasuryEntry(companyId);
  const updateEntry = useUpdateTreasuryEntry(companyId);
  const deleteEntry = useDeleteTreasuryEntry(companyId);
  const { canModify } = useCompanyPermissions(companyId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TreasuryEntry | null>(null);
  const [deleting, setDeleting] = useState<TreasuryEntry | null>(null);

  const editValues: TreasuryEntryInput | undefined = editing
    ? {
        date: editing.date.slice(0, 10),
        pieceNumber: editing.pieceNumber ?? "",
        label: editing.label,
        category: editing.category,
        type: editing.type,
        amount: Number(editing.amount),
        support: editing.support,
        paymentMethod: editing.paymentMethod ?? "",
        status: editing.status,
      }
    : undefined;

  return (
    <div>
      {dashboard && (
        <>
          <div className="mb-4 flex items-center justify-between rounded-md border border-border bg-secondary/40 p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Trésorerie totale
              </p>
              <p className="tabular font-display text-2xl font-medium text-foreground">
                {formatAmount(dashboard.position.totalBalance)}
              </p>
            </div>
            <SignalBadge signal={dashboard.position.signal} />
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <StatCard
                  icon={Landmark}
                  label="Solde banque + mobile"
                  value={formatAmount(dashboard.position.bankBalance)}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <StatCard
                  icon={Wallet}
                  label="Solde caisse"
                  value={formatAmount(dashboard.position.cashBalance)}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <StatCard
                  icon={TrendingUp}
                  label="Flux net (cumulé)"
                  value={formatAmount(dashboard.position.netFlowYTD)}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <StatCard
                  icon={AlertTriangle}
                  label="Solde min. prévu (12 mois)"
                  value={formatAmount(dashboard.forecast.minBalance)}
                  sub={`${dashboard.forecast.criticalMonths} mois critique(s), ${dashboard.forecast.alertMonths} en alerte`}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">
                Évolution du solde prévu — {fiscalYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyBalanceChart schedule={dashboard.forecast.schedule} />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">
                Prévisionnel vs réel — {fiscalYear}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mois</TableHead>
                    {MONTH_LABELS.map((m) => (
                      <TableHead key={m} className="text-right">
                        {m}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Prévu</TableCell>
                    {dashboard.forecast.schedule.map((m) => (
                      <TableCell
                        key={m.month}
                        className="tabular text-right text-xs"
                      >
                        {formatAmount(m.closingBalance)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Réel</TableCell>
                    {dashboard.actualVsForecast.schedule.map((m) => (
                      <TableCell
                        key={m.month}
                        className="tabular text-right text-xs"
                      >
                        {formatAmount(m.closingBalance)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
              <p className="mt-3 text-xs text-muted-foreground">
                Taux de réalisation encaissements :{" "}
                {(
                  dashboard.actualVsForecast.inflowRealizationRate * 100
                ).toFixed(0)}
                % · décaissements :{" "}
                {(
                  dashboard.actualVsForecast.outflowRealizationRate * 100
                ).toFixed(0)}
                %
              </p>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {entries ? `${entries.length} écriture(s)` : "Chargement…"}
        </p>
        <Button
          variant="accent"
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nouvelle écriture
        </Button>
      </div>

      <div className="mt-4">
        {isLoading && <LoadingState />}

        {entries && entries.length === 0 && (
          <EmptyState icon={Wallet} message="Aucune écriture enregistrée." />
        )}

        {entries && entries.length > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Catégorie
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Support
                  </TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => {
                  const editable = canModify(e.createdById);
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(e.date)}
                      </TableCell>
                      <TableCell className="font-medium">{e.label}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {e.category}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{e.support}</Badge>
                      </TableCell>
                      <TableCell
                        className={`tabular text-right font-medium ${e.type === "Encaissement" ? "text-success" : "text-destructive"}`}
                      >
                        {e.type === "Encaissement" ? "+" : "-"}
                        {formatAmount(Number(e.amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        {editable ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditing(e);
                                setFormOpen(true);
                              }}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleting(e)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {e.createdBy
                              ? `par ${e.createdBy.fullName || e.createdBy.email}`
                              : "—"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier l'écriture" : "Nouvelle écriture"}
            </DialogTitle>
          </DialogHeader>
          <EntryForm
            initialValues={editValues}
            submitLabel={editing ? "Enregistrer" : "Enregistrer l'écriture"}
            onSubmit={async (values) => {
              if (editing)
                await updateEntry.mutateAsync({
                  id: editing.id,
                  input: values,
                });
              else await createEntry.mutateAsync(values);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer cette écriture ?"
        description={
          <>
            Cette action supprimera définitivement{" "}
            <strong>{deleting?.label}</strong>. Irréversible.
          </>
        }
        confirmLabel="Confirmer la suppression"
        isLoading={deleteEntry.isPending}
        onConfirm={async () => {
          if (deleting) {
            await deleteEntry.mutateAsync(deleting.id);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}

export default function TreasuryTab({ companyId }: { companyId: string }) {
  return (
    <Tabs defaultValue="journal">
      <TabsList>
        <TabsTrigger value="journal">Journal & Budget</TabsTrigger>
        <TabsTrigger value="reconciliation">Rapprochement bancaire</TabsTrigger>
      </TabsList>
      <div className="mt-4">
        <TabsContent value="journal">
          <TreasuryJournalTab companyId={companyId} />
        </TabsContent>
        <TabsContent value="reconciliation">
          <ReconciliationTab companyId={companyId} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
