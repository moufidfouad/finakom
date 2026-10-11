import { useState } from "react";
import { History, Plus, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuditLog } from "./auditLog.api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AuditAction } from "@/types";
import { LoadingState } from "@/components/ui/loading-state";
import { useDataTable } from "@/hooks/useDataTable";
import { SearchBar } from "@/components/ui/search-bar";
import { TablePagination } from "@/components/ui/table-pagination";

const ENTITY_TYPE_LABELS: Record<string, string> = {
  // Entités déjà présentes
  JournalEntry: "Écriture comptable",
  SalesDocument: "Document commercial",
  PurchaseDocument: "Document d'achat",
  TreasuryEntry: "Trésorerie",
  Payment: "Paiement",
  SupplierPayment: "Règlement fournisseur",

  // Ajouts pour couvrir toutes les entités financières et sensibles
  Analysis: "Analyse financière",
  AssetMovement: "Mouvement d'immobilisation",
  BankStatementLine: "Ligne de relevé bancaire",
  BusinessPlan: "Business plan",
  ChartOfAccount: "Plan comptable",
  Client: "Client",
  ClientProductPrice: "Prix négocié par client",
  Company: "Entreprise",
  CompanyMember: "Membre d'entreprise",
  ContractAmendment: "Avenant au contrat",
  Employee: "Employé",
  FiscalYearClosing: "Clôture d'exercice",
  FixedAsset: "Immobilisation",
  FixedAssetSettings: "Paramètres d'amortissement",
  IncomeBudgetLine: "Budget prévisionnel (compte de résultat)",
  InvoicingSettings: "Paramètres de facturation",
  Payroll: "Paie",
  Product: "Article",
  StockMovement: "Mouvement de stock",
  Supplier: "Fournisseur",
  TreasuryBudgetLine: "Budget prévisionnel (trésorerie)",
  TreasurySettings: "Paramètres de trésorerie",
  User: "Utilisateur",
};

const ACTION_CONFIG: Record<
  AuditAction,
  {
    label: string;
    icon: typeof Plus;
    variant: "success" | "accent" | "destructive";
  }
> = {
  CREATE: { label: "Création", icon: Plus, variant: "success" },
  UPDATE: { label: "Modification", icon: Pencil, variant: "accent" },
  DELETE: { label: "Suppression", icon: Trash2, variant: "destructive" },
};

const ENTITY_TYPE_FILTERS = [
  "Tous",
  "JournalEntry",
  "SalesDocument",
  "PurchaseDocument",
  "TreasuryEntry",
];

export default function AuditLogTab({ companyId }: { companyId: string }) {
  const [entityTypeFilter, setEntityTypeFilter] = useState("Tous");
  const { data: logs, isLoading } = useAuditLog(
    companyId,
    entityTypeFilter === "Tous" ? undefined : entityTypeFilter,
  );

  // Pas un vrai <Table> (liste de cartes) — recherche et pagination
  // seulement. Particulièrement utile ici : un journal d'audit accumule des
  // entrées en continu, potentiellement des centaines à terme.
  const table = useDataTable(logs, {
    searchFields: (l) => [
      l.entityLabel,
      l.summary,
      l.user?.fullName,
      l.user?.email,
    ],
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">
          Historique des créations, modifications et suppressions sur les objets
          financiers sensibles de cette entreprise.
        </p>
        <div className="inline-flex items-center gap-1 overflow-x-auto rounded-lg bg-secondary/60 p-1">
          {ENTITY_TYPE_FILTERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEntityTypeFilter(t)}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                entityTypeFilter === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "Tous" ? "Tous" : (ENTITY_TYPE_LABELS[t] ?? t)}
            </button>
          ))}
        </div>
      </div>

      {logs && logs.length > 0 && (
        <div className="mt-4">
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Rechercher dans l'activité…"
          />
        </div>
      )}

      <div className="mt-4">
        {isLoading && <LoadingState />}

        {logs && logs.length === 0 && (
          <EmptyState
            icon={History}
            message="Aucune activité enregistrée pour le moment."
          />
        )}

        {logs && logs.length > 0 && table.totalCount === 0 && (
          <EmptyState
            icon={History}
            message="Aucune activité ne correspond à cette recherche."
          />
        )}

        {logs && table.totalCount > 0 && (
          <>
            <ul className="flex flex-col gap-2">
              {table.data.map((log) => {
                const config = ACTION_CONFIG[log.action];
                const Icon = config.icon;
                return (
                  <li key={log.id}>
                    <Card>
                      <CardContent className="flex items-start gap-3 p-4">
                        <div
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            config.variant === "success" &&
                              "bg-success/10 text-success",
                            config.variant === "accent" &&
                              "bg-accent/10 text-accent",
                            config.variant === "destructive" &&
                              "bg-destructive/10 text-destructive",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={config.variant}>
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {ENTITY_TYPE_LABELS[log.entityType] ??
                                log.entityType}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium">
                            {log.entityLabel}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {log.summary}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {log.user
                              ? log.user.fullName || log.user.email
                              : "Utilisateur supprimé"}{" "}
                            · {new Date(log.createdAt).toLocaleString("fr-FR")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
            <TablePagination
              page={table.page}
              totalPages={table.totalPages}
              totalCount={table.totalCount}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
