import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router ne scrolle jamais automatiquement vers un fragment d'URL
 * (#ancre), contrairement à un lien HTML natif — sans ce composant, un lien
 * du type "/#modules" cliqué depuis une autre page (ex: le footer sur
 * /contact) naviguerait vers l'accueil sans jamais atteindre la section visée.
 */
export default function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    // Laisse le temps à la page de destination de monter avant de chercher l'élément.
    const timeout = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 80);
    return () => clearTimeout(timeout);
  }, [location.pathname, location.hash]);

  return null;
}
