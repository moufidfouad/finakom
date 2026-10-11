import { useAuth } from "@/context/AuthContext/context";
import { useCandidateAuth } from "@/context/CandidateAuthContext/context";
import { Navigate, Outlet } from "react-router-dom";

export function AdminRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/connexion" replace />;
  if (!isAdmin) return <Navigate to="/app/entreprises" replace />;
  return <Outlet />;
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/connexion" replace />;
  return <Outlet />;
}

/** Plus strict qu'AdminRoute : réservé exclusivement au SUPERADMIN (ex: gestion des utilisateurs). */
export function SuperAdminRoute() {
  const { isAuthenticated, isSuperAdmin, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/connexion" replace />;
  if (!isSuperAdmin) return <Navigate to="/app/entreprises" replace />;
  return <Outlet />;
}

export function CandidateProtectedRoute() {
  const { isAuthenticated, isLoading } = useCandidateAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/candidat/connexion" replace />;
  return <Outlet />;
}
