import { useState } from "react";
import { Pencil } from "lucide-react";
import {
  useAdminUsers,
  useUpdateAdminUser,
} from "@/features/admin/adminUsers.api";
import UserEditForm from "@/features/admin/UserEditForm";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { formatDate } from "@/lib/format";
import { AdminUser } from "@/types";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/context/AuthContext/context";

const roleVariant: Record<string, "success" | "accent" | "secondary"> = {
  SUPERADMIN: "success",
  ADMIN: "accent",
  USER: "secondary",
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useAdminUsers();
  const updateUser = useUpdateAdminUser();
  const [editing, setEditing] = useState<AdminUser | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-medium text-foreground">
        Utilisateurs de la plateforme
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {users ? `${users.length} compte(s)` : "Chargement…"} — réservé au
        super-administrateur.
      </p>

      <div className="mt-6">
        {isLoading && <LoadingState />}
        {users && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Créé le
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Entreprises
                  </TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <p className="font-medium">{u.fullName || u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.email}
                        {u.id === currentUser?.id && " (vous)"}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell tabular text-muted-foreground">
                      {u._count.companies} créée(s) ·{" "}
                      {u._count.companyMemberships} membre(s)
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleVariant[u.role] ?? "secondary"}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditing(u)}
                        aria-label="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          {editing && (
            <UserEditForm
              user={editing}
              onSubmit={async (values) => {
                await updateUser.mutateAsync({ id: editing.id, input: values });
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
