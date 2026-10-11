const STOP_WORDS = new Set([
  "de",
  "du",
  "des",
  "le",
  "la",
  "les",
  "un",
  "une",
  "et",
  "ou",
  "à",
  "en",
  "pour",
  "dans",
  "sur",
  "avec",
  "sans",
  "au",
  "aux",
  "ce",
  "ces",
  "cet",
  "cette",
]);

/** Acronymes métier courts (≤2 caractères) mais significatifs dans ce contexte
 * de recrutement — sans cette liste, la règle générale "plus de 2 caractères"
 * exclurait "RH" ou "IT" alors qu'elle garde "CDI"/"BTP" (3 lettres) par
 * simple coïncidence de longueur, un angle mort repéré en écrivant les tests. */
const SHORT_BUSINESS_ACRONYMS = new Set(["rh", "it"]);

/**
 * Extrait les mots significatifs d'un texte — minuscules, sans accents (pour
 * tolérer "developpeur"/"développeur"), mots vides et trop courts exclus.
 * Fonction pure et testée isolément, cohérent avec le style déjà établi pour
 * le moteur d'alertes entreprise (checksEngine.ts).
 */
export function extractKeywords(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // retire les diacritiques

  const words = normalized.match(/[a-z0-9]+/g) ?? [];
  return new Set(
    words.filter(
      (w) =>
        (w.length > 2 || SHORT_BUSINESS_ACRONYMS.has(w)) && !STOP_WORDS.has(w),
    ),
  );
}

export interface CandidateCvForMatching {
  title: string;
  skillTitles: string[];
}

/**
 * Un CV correspond à une offre si au moins un mot significatif du titre du
 * CV OU d'une compétence recoupe un mot significatif du titre de l'offre —
 * volontairement simple (pas de matching sémantique/IA), suffisant pour
 * éviter la notification en masse non pertinente sans construire un système
 * d'abonnement complet. Cible le TITRE de l'offre, pas la description : la
 * description est longue et généraliste, elle produirait trop de faux positifs.
 */
export function cvMatchesJobPosting(
  cv: CandidateCvForMatching,
  jobPostingTitle: string,
): boolean {
  const postingKeywords = extractKeywords(jobPostingTitle);
  if (postingKeywords.size === 0) return false;

  const cvKeywords = extractKeywords([cv.title, ...cv.skillTitles].join(" "));
  for (const word of cvKeywords) {
    if (postingKeywords.has(word)) return true;
  }
  return false;
}
