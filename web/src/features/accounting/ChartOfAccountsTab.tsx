import { useState } from "react";
import { Download, Plus, Sparkles, Wallet } from "lucide-react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { ChartOfAccount, CreateAccountInput } from "@/types";
import {
  useChartOfAccounts,
  useCreateAccount,
  useSeedDefaultAccounts,
} from "./chartOfAccounts.api";
import { useAccountLedger } from "./journalEntries.api";
import { ACCOUNT_ROLES } from "./accounting.constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import  FormTextField  from "@/components/form/FormTextField";
import  FormSelectField  from "@/components/form/FormSelectField";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { getApiErrorMessage } from "@/lib/apiError";
import { EmptyState } from "@/components/ui/empty-state";
import { apiClient } from "@/lib/axios";
import { LoadingState } from "@/components/ui/loading-state";
import { useDataTable } from "@/hooks/useDataTable";
import { SearchBar } from "@/components/ui/search-bar";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { TablePagination } from "@/components/ui/table-pagination";

function AccountForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: CreateAccountInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  return (
    <Formik
      initialValues={
        { accountNumber: "", label: "", role: undefined } as CreateAccountInput
      }
      validationSchema={Yup.object({
        accountNumber: Yup.string()
          .matches(/^\d+$/, "Chiffres uniquement")
          .required("Requis"),
        label: Yup.string().min(2, "Requis").required("Requis"),
      })}
      onSubmit={async (v, { setSubmitting }) => {
        setError("");
        try {
          await onSubmit(v);
        } catch (e) {
          setError(getApiErrorMessage(e));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="flex flex-col gap-5" noValidate>
          <FormTextField
            name="accountNumber"
            label="Numéro de compte"
            placeholder="411000"
          />
          <FormTextField name="label" label="Libellé" placeholder="Clients" />
          <FormSelectField
            name="role"
            label="Rôle (optionnel — pour la comptabilisation automatique)"
            placeholder="Aucun"
            options={ACCOUNT_ROLES}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" variant="accent" isLoading={isSubmitting}>
              Ajouter
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

function AccountLedgerDialog({
  account,
  onClose,
}: {
  account: ChartOfAccount;
  onClose: () => void;
}) {
  const { data: ledger, isLoading } = useAccountLedger(account.id);
  const formatAmount = useFormatAmount();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex-row items-center justify-between pr-6">
          <DialogTitle>
            Grand livre — {account.accountNumber} {account.label}
          </DialogTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              window.open(
                `${apiClient.defaults.baseURL}/accounting/chart-of-accounts/${account.id}/ledger/export.csv`,
                "_blank",
              )
            }
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
        </DialogHeader>
        {isLoading && <LoadingState />}
        {ledger && (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Pièce</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Débit</TableHead>
                  <TableHead className="text-right">Crédit</TableHead>
                  <TableHead className="text-right">Solde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.lines.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">
                      {new Date(l.date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.pieceNumber}
                    </TableCell>
                    <TableCell>{l.label}</TableCell>
                    <TableCell className="tabular text-right">
                      {l.debit > 0 ? formatAmount(l.debit) : ""}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {l.credit > 0 ? formatAmount(l.credit) : ""}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {formatAmount(l.runningBalance)}
                    </TableCell>
                  </TableRow>
                ))}
                {ledger.lines.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Aucun mouvement sur ce compte.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <p className="mt-3 text-right text-sm font-medium">
              Solde final : {formatAmount(ledger.finalBalance)}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ChartOfAccountsTab({
  companyId,
}: {
  companyId: string;
}) {
  const { data: accounts, isLoading } = useChartOfAccounts(companyId);
  const seedDefaults = useSeedDefaultAccounts(companyId);
  const createAccount = useCreateAccount(companyId);
  const [formOpen, setFormOpen] = useState(false);
  const [ledgerAccount, setLedgerAccount] = useState<ChartOfAccount | null>(
    null,
  );

  const table = useDataTable(accounts, {
    searchFields: (a) => [a.accountNumber, a.label, a.role],
    sortAccessors: {
      accountNumber: (a) => a.accountNumber,
      label: (a) => a.label,
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {accounts ? `${accounts.length} compte(s)` : "Chargement…"}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            isLoading={seedDefaults.isPending}
            onClick={() => seedDefaults.mutate()}
          >
            <Sparkles className="h-4 w-4" /> Appliquer la trame SYSCOHADA
          </Button>
          <Button variant="accent" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Nouveau compte
          </Button>
        </div>
      </div>

      {accounts && accounts.length > 0 && (
        <div className="mt-4">
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Rechercher un compte…"
          />
        </div>
      )}

      <div className="mt-4">
        {isLoading && <LoadingState />}
        {accounts && accounts.length === 0 && (
          <EmptyState
            icon={Wallet}
            message="Aucun compte — appliquez la trame SYSCOHADA standard pour démarrer rapidement."
          />
        )}
        {accounts && accounts.length > 0 && table.totalCount === 0 && (
          <EmptyState
            icon={Wallet}
            message="Aucun compte ne correspond à cette recherche."
          />
        )}
        {accounts && table.totalCount > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead
                    sortKey="accountNumber"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Compte
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="label"
                    activeSort={table.sort}
                    onSort={table.toggleSort}
                  >
                    Libellé
                  </SortableTableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.data.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => setLedgerAccount(a)}
                  >
                    <TableCell className="font-mono text-xs">
                      {a.accountNumber}
                    </TableCell>
                    <TableCell className="font-medium">{a.label}</TableCell>
                    <TableCell>
                      {a.role && (
                        <Badge variant="secondary">
                          {ACCOUNT_ROLES.find((r) => r.value === a.role)
                            ?.label ?? a.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      Voir le grand livre →
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={table.page}
              totalPages={table.totalPages}
              totalCount={table.totalCount}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
            />
          </Card>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau compte</DialogTitle>
          </DialogHeader>
          <AccountForm
            onSubmit={async (v) => {
              await createAccount.mutateAsync(v);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {ledgerAccount && (
        <AccountLedgerDialog
          account={ledgerAccount}
          onClose={() => setLedgerAccount(null)}
        />
      )}
    </div>
  );
}
