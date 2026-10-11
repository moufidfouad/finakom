import { FC, ReactNode, useEffect, useState } from "react";
import { apiClient } from "@/lib/axios";
import { User } from "@/types";
import { AuthContext } from "./context";

const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // La session vit dans un cookie httpOnly envoyé automatiquement par le navigateur :
  // il suffit d'interroger /auth/me au montage. Un 401 ici est un état NORMAL
  // ("pas connecté"), géré par le .catch ci-dessous — voir lib/axios.ts qui exclut
  // volontairement /auth/me du flux refresh+redirect (sinon boucle de rechargement).
  useEffect(() => {
    apiClient
      .get<User>("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { data } = await apiClient.post<{ user: User }>("/auth/login", {
      email,
      password,
    });
    setUser(data.user);
  }

  async function loginWithGoogle(idToken: string) {
    const { data } = await apiClient.post<{ user: User }>("/auth/google", {
      idToken,
    });
    setUser(data.user);
  }

  async function register(email: string, password: string, fullName?: string) {
    const { data } = await apiClient.post<{ user: User }>("/auth/register", {
      email,
      password,
      fullName,
    });
    setUser(data.user);
  }

  async function logout() {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      setUser(null);
    }
  }

  /** Recharge le profil depuis /auth/me — utile après vérification d'email ou
   * changement de mot de passe pour resynchroniser l'état affiché (ex: bannière
   * "email non vérifié") sans forcer une reconnexion complète. */
  async function refreshProfile() {
    try {
      const { data } = await apiClient.get<User>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "ADMIN" || user?.role === "SUPERADMIN",
        isSuperAdmin: user?.role === "SUPERADMIN",
        login,
        loginWithGoogle,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
