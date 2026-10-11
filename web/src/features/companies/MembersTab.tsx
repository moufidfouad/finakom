import { useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useCompany } from "./companies.api";
import {
  useCompanyMembers,
  useCreateCompanyMember,
  useRemoveCompanyMember,
  useUpdateCompanyMemberRole,
} from "./members.api";
import MemberForm from "./MemberForm";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { CompanyRole } from "@/types";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/context/AuthContext/context";

export default function MembersTab({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const { data: company } = useCompany(companyId);
  const { data: members, isLoading } = useCompanyMembers(companyId);
  const createMember = useCreateCompanyMember(companyId);
  const updateRole = useUpdateCompanyMemberRole(companyId);
  const removeMember = useRemoveCompanyMember(companyId);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {members ? `${members.length} membre(s)` : "Chargement…"} — un
          administrateur gère l'entreprise, un membre manipule
          devis/factures/BL.
        </p>
        <Button variant="accent" size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" /> Ajouter un membre
        </Button>
      </div>

      <div className="mt-4">
        {isLoading && <LoadingState />}

        {members && members.length === 0 && (
          <EmptyState icon={Users} message="Aucun membre pour le moment." />
        )}

        {members && members.length > 0 && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Membre depuis
                  </TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const isOwner = m.user.id === company?.userId;
                  const isSelf = m.user.id === user?.id;
                  return (
                    <TableRow key={m.user.id}>
                      <TableCell>
                        <p className="font-medium">
                          {m.user.fullName || m.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.user.email}
                          {isSelf && " (vous)"}
                        </p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatDate(m.createdAt)}
                      </TableCell>
                      <TableCell>
                        {isOwner ? (
                          <Badge variant="secondary">Créateur · ADMIN</Badge>
                        ) : (
                          <Select
                            value={m.role}
                            onValueChange={(v) =>
                              updateRole.mutate({
                                userId: m.user.id,
                                role: v as CompanyRole,
                              })
                            }
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">
                                Administrateur
                              </SelectItem>
                              <SelectItem value="MEMBER">Membre</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMember.mutate(m.user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
            <DialogTitle>Ajouter un membre</DialogTitle>
          </DialogHeader>
          <MemberForm
            onSubmit={async (values) => {
              await createMember.mutateAsync(values);
              setFormOpen(false);
            }}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
