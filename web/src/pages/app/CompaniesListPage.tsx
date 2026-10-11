import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Building2 } from "lucide-react";
import {
  useCompanies,
  useCreateCompany,
} from "@/features/companies/companies.api";
import CompanyForm from "@/features/companies/CompanyForm";
import GroupDashboardCard from "@/features/companies/GroupDashboardCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/context/AuthContext/context";
import { useCurrentCompany } from "@/context/CurrentCompanyContext/context";

export default function CompaniesListPage() {
  const { data: companies, isLoading, isError } = useCompanies();
  const createCompany = useCreateCompany();
  const { isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const { setCurrentCompany, } = useCurrentCompany();

  useEffect(() => {
    setCurrentCompany(null);
  }, [setCurrentCompany]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            {isSuperAdmin ? "Toutes les entreprises" : "Mes entreprises"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSuperAdmin
              ? "Vue super-administrateur : entreprises de tous les utilisateurs de la plateforme."
              : "Créez autant d'entreprises que nécessaire pour vos analyses, votre personnel et votre facturation."}
          </p>
        </div>
        <Button
          variant="accent"
          onClick={() => setOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Nouvelle entreprise
        </Button>
      </div>

      <div className="mt-8">
        {!isSuperAdmin && <GroupDashboardCard />}
        {isLoading && <LoadingState />}
        {isError && (
          <p className="text-sm text-destructive">
            Impossible de charger les entreprises.
          </p>
        )}

        {companies && companies.length === 0 && (
          <EmptyState
            icon={Building2}
            title="Aucune entreprise pour le moment"
            message="Ajoutez votre première entreprise pour commencer."
            actionLabel="Nouvelle entreprise"
            onAction={() => setOpen(true)}
          />
        )}

        {companies && companies.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <Link key={c.id} to={`/app/entreprises/${c.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col justify-between p-5">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {c.sector || "Secteur non renseigné"}
                      </p>
                      <h3 className="mt-1.5 font-display text-lg font-medium text-foreground">
                        {c.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {c.country} · {c.currency}
                      </p>
                      {isSuperAdmin && c.user && (
                        <p className="mt-1.5 truncate text-xs text-muted-foreground">
                          Propriétaire : {c.user.fullName || c.user.email}
                        </p>
                      )}
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <Badge variant="secondary">
                        {c.accountingSystem === "SMT"
                          ? "Système SMT"
                          : "Système Normal"}
                      </Badge>
                      <span className="tabular text-xs text-muted-foreground">
                        {c._count?.analyses ?? 0} analyse(s)
                      </span>
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
            <DialogTitle>Nouvelle entreprise</DialogTitle>
          </DialogHeader>
          <CompanyForm
            onSubmit={async (values) => {
              await createCompany.mutateAsync(values);
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
