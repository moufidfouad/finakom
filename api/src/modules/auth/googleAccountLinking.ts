/**
 * Décide quoi faire lors d'une connexion Google, à partir des résultats de
 * recherche déjà effectués en base (userByGoogleId, userByEmail) — fonction
 * pure, sans accès base, pour rester testable en isolation.
 *
 * Règles :
 *  - Un compte déjà lié à ce googleId → connexion directe.
 *  - Sinon, un compte local existe avec le même email → on le RATTACHE à Google
 *    (Google a lui-même vérifié cet email avant d'émettre le jeton d'identité :
 *    ce rattachement est donc légitime même si notre propre vérification par
 *    email n'a pas encore eu lieu sur ce compte).
 *  - Sinon → création d'un nouveau compte.
 */
export type GoogleAccountAction =
  | { kind: "LOGIN_EXISTING_GOOGLE"; userId: string }
  | { kind: "LINK_EXISTING_LOCAL"; userId: string }
  | { kind: "CREATE_NEW" };

export function decideGoogleAccountAction(params: {
  userByGoogleId: { id: string } | null;
  userByEmail: { id: string } | null;
}): GoogleAccountAction {
  if (params.userByGoogleId)
    return { kind: "LOGIN_EXISTING_GOOGLE", userId: params.userByGoogleId.id };
  if (params.userByEmail)
    return { kind: "LINK_EXISTING_LOCAL", userId: params.userByEmail.id };
  return { kind: "CREATE_NEW" };
}
