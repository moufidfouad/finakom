import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  ContactMessage,
  useContactMessages,
  useDeleteMessage,
  useMarkMessageRead,
} from "@/features/admin/adminContact.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { formatDate } from "@/lib/format";

export default function AdminMessagesPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const { data, isLoading } = useContactMessages(page, unreadOnly);
  const markRead = useMarkMessageRead();
  const deleteMessage = useDeleteMessage();

  function open(m: ContactMessage) {
    setSelected(m);
    if (!m.isRead) markRead.mutate({ id: m.id, isRead: true });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Messages de contact
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data
              ? `${data.unreadCount} non lu(s) sur ${data.total}`
              : "Chargement…"}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setUnreadOnly(e.target.checked);
              setPage(1);
            }}
          />
          Non lus uniquement
        </label>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-2">
          {isLoading && <LoadingState />}
          {data?.items.map((m) => (
            <Card
              key={m.id}
              className={`cursor-pointer transition-colors ${selected?.id === m.id ? "border-primary" : ""}`}
              onClick={() => open(m)}
            >
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!m.isRead && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    )}
                    <p
                      className={`truncate text-sm ${m.isRead ? "text-muted-foreground" : "font-medium text-foreground"}`}
                    >
                      {m.fullName}
                    </p>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.subject}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(m.createdAt)}
                </span>
              </CardContent>
            </Card>
          ))}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Précédent
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {data.page}/{data.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant →
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            {!selected && (
              <p className="text-sm text-muted-foreground">
                Sélectionnez un message pour le lire.
              </p>
            )}
            {selected && (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-lg font-medium">
                      {selected.subject}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selected.fullName} ·{" "}
                      <a
                        href={`mailto:${selected.email}`}
                        className="hover:underline"
                      >
                        {selected.email}
                      </a>
                    </p>
                    <Badge variant="secondary" className="mt-2">
                      {formatDate(selected.createdAt)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await deleteMessage.mutateAsync(selected.id);
                      setSelected(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">
                  {selected.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
