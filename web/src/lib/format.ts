export function formatAmount(value: number, currency = "XOF"): string {
  return (
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value) +
    " " +
    currency
  );
}

export function formatPct(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)} %`;
}

export function formatDate(
  value: string | Date,
  {
    locale = "fr-FR",
    ...options
  }: { locale?: Intl.LocalesArgument } & Intl.DateTimeFormatOptions = {}
): string {
  return new Date(value).toLocaleDateString(locale, options);
}
