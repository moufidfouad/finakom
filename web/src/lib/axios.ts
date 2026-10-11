import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getCsrfToken } from "./csrf";

const baseURL = `${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_V1_URL}`;
export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();
  if (csrfToken) config.headers["X-CSRF-Token"] = csrfToken;
  return config;
});

// --- Rafraîchissement automatique de la session sur 401, et auto-réparation
// d'un jeton CSRF désynchronisé sur 403 ---
// Le refresh token vit dans un cookie httpOnly : on ne le manipule jamais en JS,
// on demande simplement au serveur de rafraîchir la session (il lit son propre cookie).
// Un rafraîchissement régénère AUSSI le cookie CSRF (voir issueSessionCookies côté
// backend) : rejouer la requête après refresh répare donc aussi bien un token
// expiré qu'un cookie CSRF devenu incohérent (ex: plusieurs onglets, requêtes
// concurrentes qui régénèrent le cookie entre la lecture et l'envoi).
const CSRF_ERROR_MESSAGE = "Jeton CSRF manquant ou invalide";
let isRefreshing = false;
let pendingQueue: { resolve: () => void; reject: (err: unknown) => void }[] =
  [];

function processQueue(error: unknown) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(),
  );
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (!originalRequest) return Promise.reject(error);

    const status = error.response?.status;
    const isCsrfMismatch =
      status === 403 &&
      (error.response?.data as { error?: string } | undefined)?.error ===
        CSRF_ERROR_MESSAGE;
    const isExpiredSession = status === 401;

    if ((!isExpiredSession && !isCsrfMismatch) || originalRequest._retry) {
      return Promise.reject(error);
    }
    // /auth/me sert à VÉRIFIER s'il existe une session (appelé au montage sur
    // toutes les pages, y compris publiques). Un 401 y est un état normal
    // ("pas connecté"), pas une session expirée : ne jamais tenter de refresh
    // ni rediriger pour cette requête — AuthContext gère déjà le cas via son
    // .catch(() => setUser(null)).
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/me")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: () => resolve(apiClient(originalRequest)),
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axios.post(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      processQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      // Pas de rechargement forcé ici : un window.location.href déclenche un
      // reload complet de la SPA, qui remonte AuthProvider, qui rappelle
      // /auth/me, etc. — c'est précisément ce qui causait la boucle infinie.
      // On laisse React Router gérer la redirection : <ProtectedRoute> est déjà
      // réactif à isAuthenticated et redirige vers /connexion sans reload.
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

/**
 * Les fichiers uploadés (logos d'entreprise...) sont servis à la racine du
 * serveur (`/uploads/...`), pas sous `/api` comme le reste des endpoints — on
 * retire donc le suffixe `/api` de baseURL pour construire ces URLs directes.
 */
export function getServerOrigin(): string {
  return `${import.meta.env.VITE_API_URL}`;
}

export function getUploadUrl(relativePath: string): string {
  return `${getServerOrigin()}/uploads/${relativePath}`;
}
