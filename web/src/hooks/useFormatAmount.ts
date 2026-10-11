import { useCurrency } from "@/context/CurrencyContext/context";
import { formatAmount as formatAmountRaw } from "@/lib/format";

/**
 * Version liée au contexte de `formatAmount` — récupère automatiquement la
 * devise de l'entreprise courante
 */
export function useFormatAmount(): (value: number) => string {
  const currency = useCurrency();
  return (value: number) => formatAmountRaw(value, currency);
}
