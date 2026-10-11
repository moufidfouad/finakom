import { Client, Product, SalesDocument } from "@/types";
import DocumentForm, { DocumentFormSubmitValues } from "./DocumentForm";
import { useCreateDocument } from "./documents.api";

/**
 * Émission d'un avoir sur une facture — réutilise DocumentForm tel quel
 * (client et type verrouillés au client/type "Avoir" attendus par le
 * serveur) plutôt que de dupliquer la gestion des lignes. La seule chose que
 * DocumentForm ne connaît pas nativement est `linkedInvoiceId`, injecté ici
 * au moment de la soumission — DocumentForm.tsx lui-même reste inchangé.
 */
export default function CreditNoteForm({
  invoice,
  products,
  onSuccess,
  onCancel,
}: {
  invoice: SalesDocument;
  products: Product[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const createDocument = useCreateDocument(invoice.companyId);
  const invoiceAsClientList: Client[] = [invoice.client];

  async function handleSubmit(values: DocumentFormSubmitValues) {
    await createDocument.mutateAsync({
      type: "Avoir",
      clientId: values.clientId,
      date: values.date,
      notes: values.notes,
      linkedInvoiceId: invoice.id,
      lines: values.lines ?? [],
    });
    onSuccess();
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        L'avoir réduit automatiquement le solde dû de la facture{" "}
        <strong>{invoice.number}</strong>, sans en modifier les lignes
        d'origine. Une fois émis, il ne peut plus être modifié.
      </p>
      <DocumentForm
        clients={invoiceAsClientList}
        products={products}
        defaultType="Avoir"
        lockType
        initialValues={{
          type: "Avoir",
          clientId: invoice.clientId,
          date: new Date().toISOString().slice(0, 10),
          notes: "",
          lines: [{ productId: "", quantity: 1, unitPriceHT: 0 }],
        }}
        submitLabel="Émettre l'avoir"
        onSubmit={handleSubmit}
        onCancel={onCancel}
      />
    </div>
  );
}
