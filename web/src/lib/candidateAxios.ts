import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getCandidateCsrfToken } from "./candidateCsrf";

/**
 * Réplique lib/axios.ts, mais entièrement dédiée à l'espace candidat —
 * refresh vers /candidate-auth/refresh (pas /auth/refresh), cookie CSRF
 * candidat (pas celui de l'espace entreprise). Une instance séparée plutôt
 * qu'un apiClient généralisé par paramètre : ce fichier est déjà bien rodé
 * pour l'espace entreprise, le dupliquer avec les bonnes URLs évite tout
 * risque de régression sur le comportement existant.
 */
const baseURL = `${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_V1_URL}`;
export const candidateApiClient = axios.create({
  baseURL,
  withCredentials: true,
});

candidateApiClient.interceptors.request.use((config) => {
  const csrfToken = getCandidateCsrfToken();

  if (csrfToken) config.headers["X-CSRF-Token"] = csrfToken;
  return config;
});

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

candidateApiClient.interceptors.response.use(
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
    if (
      originalRequest.url?.includes("/candidate-auth/login") ||
      originalRequest.url?.includes("/candidate-auth/refresh") ||
      originalRequest.url?.includes("/candidate-auth/me")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: () => resolve(candidateApiClient(originalRequest)),
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axios.post(
        `${candidateApiClient.defaults.baseURL}/candidate-auth/refresh`,
        {},
        { withCredentials: true },
      );
      processQueue(null);
      return candidateApiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
