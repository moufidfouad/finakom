/**
 * Les polices standard de pdfkit (Helvetica...) sont limitées à l'encodage
 * WinAnsi (~CP1252) : ASCII + Latin-1 accentué + quelques signes de ponctuation
 * étendue (tiret cadratin, guillemets courbes...). Au-delà, tout caractère
 * (emoji, symboles ✓⚠✅❌ℹ▲▼, dingbats...) s'affiche comme un glyphe de
 * substitution illisible. Nos moteurs (business plan, ratios financiers)
 * utilisent ces symboles pour un affichage agréable à l'écran — on les
 * remplace par un équivalent textuel uniquement au moment du rendu PDF, sans
 * toucher aux messages eux-mêmes.
 *
 * Remplacements explicites d'abord (préservent le sens), puis un filet de
 * sécurité générique qui retire tout codepoint ≥ U+2190 (flèches, symboles,
 * dingbats, emoji) resté non couvert — bien au-dessus de la ponctuation
 * française usuelle et des caractères accentués, qui restent donc intacts.
 */
const EXPLICIT_REPLACEMENTS: [RegExp, string][] = [
  [/✅/g, "[OK]"],
  [/❌/g, "[X]"],
  [/⚠️|⚠/g, "[!]"],
  [/✓/g, "[OK]"],
  [/ℹ️|ℹ/g, "[i]"],
  [/▲/g, "(+)"],
  [/▼/g, "(-)"],
  [/🔴/g, "[CRITIQUE]"],
  [/🟡/g, "[ALERTE]"],
  [/🟢/g, "[OK]"],
  [/≥/g, ">="],
  [/≤/g, "<="],
  [/→/g, "->"],
  [/−/g, "-"], // signe moins mathématique (U+2212), distinct du trait d'union ASCII
];

export function sanitizeForPdf(text: string): string {
  let out = text;
  for (const [pattern, replacement] of EXPLICIT_REPLACEMENTS)
    out = out.replace(pattern, replacement);
  return out.replace(/[\u2190-\u{10FFFF}]/gu, "");
}

/** Même correction que les autres exports PDF : évite le glyphe de substitution
 * de l'espace fine insécable de Intl.NumberFormat('fr-FR'), absente de WinAnsi. */
export function formatAmountForPdf(value: number, currency: string): string {
  const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 })
    .format(value)
    .replace(/[\u202F\u00A0]/g, " ");
  return `${formatted} ${currency}`;
}
