import { AppError } from "./AppError";
import { AuthenticatedUser } from "@/types/express";
import { isSuperAdmin } from "./authContext";
import { isCompanyAdmin } from "@/modules/companies/companies.service";

export interface OwnedResource {
  companyId: string;
  createdById: string | null;
}

interface AssertCanModifyOptions {
  /** Message d'erreur complet — laissé libre plutôt que généré (le français
   * accorde "le"/"la" selon le genre de la ressource : "le modifier" pour un
   * document, "la modifier" pour une écriture — une génération automatique
   * serait fragile). */
  errorMessage: string;
  /** 'forbidden' (défaut, 403) : la ressource existe mais l'accès est refusé,
   * message explicite. 'notFound' (404) : cache même l'existence de la
   * ressource à qui n'y a pas droit — utilisé pour les paiements, où révéler
   * "ce paiement existe mais vous n'y avez pas accès" serait déjà une fuite
   * d'information. */
  onDenied?: "forbidden" | "notFound";
}

/**
 * Règle d'autorisation partagée par les modules où un MEMBER peut gérer les
 * ressources qu'il a lui-même créées, un administrateur d'entreprise a accès
 * à tout, et le SUPERADMIN a tous les droits — documents de vente, documents
 * d'achat, écritures de trésorerie, business plans, immobilisations,
 * paiements. Centralise une logique qui était dupliquée à l'identique dans
 * sept services distincts, avec un risque de divergence si la règle devait
 * évoluer un jour sans que tous les endroits soient mis à jour.
 */
export async function assertCanModifyOwnedResource(
  resource: OwnedResource,
  auth: AuthenticatedUser,
  options: AssertCanModifyOptions,
): Promise<void> {
  if (isSuperAdmin(auth.role)) return;
  if (resource.createdById && resource.createdById === auth.userId) return;
  if (await isCompanyAdmin(resource.companyId, auth)) return;

  if (options.onDenied === "notFound")
    throw AppError.notFound(options.errorMessage);
  throw AppError.forbidden(options.errorMessage);
}
