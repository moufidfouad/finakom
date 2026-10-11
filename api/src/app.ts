import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "@/config/env";
import { UPLOADS_ROOT } from "@/config/uploads";
import routes from "@/routes";
import { errorHandler, notFoundHandler } from "@/middlewares/errorHandler";
import { requireCsrf } from "@/middlewares/csrf";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // permet aux <img> du frontend (autre origine en dev) de charger les logos
  // credentials:true est indispensable pour que le navigateur envoie/accepte les
  // cookies httpOnly cross-origin (front sur :5173, API sur :4000 en développement).
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Fichiers uploadés (logos d'entreprise...) — lecture publique volontaire : un
  // logo n'est pas une donnée sensible, et l'URL contient un identifiant
  // d'entreprise non devinable ; ceci simplifie aussi son intégration directe
  // dans les balises <img> du frontend (pas d'en-têtes d'authentification possibles).
  app.use("/uploads", express.static(UPLOADS_ROOT));

  // Protection CSRF globale (double-submit cookie) sur toutes les routes mutantes,
  // avant même le routeur applicatif — voir les exemptions dans middlewares/csrf.ts. 
  app.use(requireCsrf);

  app.use(`/${env.API_V1_URL}`, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
