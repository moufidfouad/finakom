import path from "path";
import fs from "fs";
import { env } from "./env";

/** Racine absolue de stockage des fichiers uploadés (logos...), créée au démarrage si absente. */
export const UPLOADS_ROOT = path.resolve(process.cwd(), env.UPLOADS_DIR);
export const LOGOS_DIR = path.join(UPLOADS_ROOT, "logos");

fs.mkdirSync(LOGOS_DIR, { recursive: true });

/** Chemin absolu sur disque à partir du chemin relatif stocké en base (ex: "logos/{id}.png"). */
export function resolveUploadPath(relativePath: string): string {
  return path.join(UPLOADS_ROOT, relativePath);
}
