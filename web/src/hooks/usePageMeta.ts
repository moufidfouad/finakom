import { useEffect } from "react";

const SITE_URL = "https://finakom.app"; // à ajuster si le domaine de production diffère
const SITE_NAME = "FINAKOM";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface PageMetaOptions {
  /** Titre complet de l'onglet, PAS juste le nom de la section — chaque page
   * publique doit avoir un titre unique et descriptif, condition de base pour
   * qu'un moteur de recherche les distingue les unes des autres. */
  title: string;
  description: string;
  /** Chemin relatif de la page (ex: '/', '/a-propos') — sert à construire
   * l'URL canonique et l'URL de partage social. */
  path: string;
  image?: string;
  /** Empêche l'indexation de cette page précise — utilisé pour l'annuaire de
   * CV public (données personnelles de candidats, jamais destinées à
   * apparaître dans une recherche Google) alors que index.html déclare
   * "index, follow" par défaut pour tout le reste du site. */
  noindex?: boolean;
}

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLinkTag(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Définit titre, description, URL canonique et balises de partage social
 * (Open Graph + Twitter Card) pour la page courante — condition pour que les
 * pages publiques se distinguent les unes des autres dans les résultats de
 * recherche (auparavant : un seul title/description fixés une fois pour
 * toutes dans index.html, identiques sur tout le site) et pour qu'un lien
 * partagé sur les réseaux sociaux affiche un vrai aperçu.
 *
 * Volontairement un hook léger plutôt qu'une dépendance comme
 * react-helmet-async : seules 4 pages publiques en ont besoin, une vraie
 * librairie de gestion de head serait disproportionnée pour ce besoin.
 */
export function usePageMeta({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  noindex = false,
}: PageMetaOptions) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    document.title = title;
    setMetaTag("name", "description", description);
    setLinkTag("canonical", url);
    setMetaTag(
      "name",
      "robots",
      noindex ? "noindex, nofollow" : "index, follow",
    );

    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", url);
    setMetaTag("property", "og:type", "website");
    setMetaTag("property", "og:site_name", SITE_NAME);
    setMetaTag("property", "og:locale", "fr_FR");
    setMetaTag("property", "og:image", image);

    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", image);

    // Remet "index, follow" au démontage — sans ça, quitter une page noindex
    // (ex: l'annuaire de CV) laisserait la balise robots figée sur la
    // dernière valeur posée pour toute page suivante qui ne l'écrase pas explicitement.
    return () => setMetaTag("name", "robots", "index, follow");
  }, [title, description, path, image, noindex]);
}
