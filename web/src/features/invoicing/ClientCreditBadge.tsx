import { useClientCreditStatus } from "./clients.api";
import { Badge } from "@/components/ui/badge";
import { useFormatAmount } from "@/hooks/useFormatAmount";

/** N'affiche rien si le client n'a pas de limite configurée — pas la peine
 * d'occuper l'écran avec un indicateur pour un client sans contrôle d'encours. */
export default function ClientCreditBadge({
  clientId,
  hasLimit,
}: {
  clientId: string;
  hasLimit: boolean;
}) {
  const formatAmount = useFormatAmount();
  const { data: status } = useClientCreditStatus(clientId, hasLimit);

  if (!hasLimit || !status || status.creditLimit === null) return null;

  return (
    <Badge variant={status.wouldExceed ? "destructive" : "secondary"}>
      {formatAmount(status.currentOutstanding)} /{" "}
      {formatAmount(status.creditLimit)}
    </Badge>
  );
}
