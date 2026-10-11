import { Link } from "react-router-dom";
import { Bell, Briefcase, Mail, MessageSquare } from "lucide-react";
import {
  useCandidateNotifications,
  useMarkNotificationRead,
} from "@/features/candidateNotifications/candidateNotifications.api";
import { CandidateJobNotification } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { usePageMeta } from "@/hooks/usePageMeta";

function NotificationCard({
  notification,
  onRead,
}: {
  notification: CandidateJobNotification;
  onRead: () => void;
}) {
  const unread = !notification.readAt;
  const cardClass = unread ? "border-accent/40 bg-accent/5" : undefined;

  if (notification.type === "job_match") {
    return (
      <Link to={`/offres/${notification.jobPostingId}`} onClick={onRead}>
        <Card className={cardClass}>
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {notification.jobPosting.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {notification.jobPosting.company.name}
                </p>
              </div>
            </div>
            {unread && <Badge variant="accent">Nouveau</Badge>}
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (notification.type === "new_message") {
    const senderName =
      notification.otherParticipant?.company?.name ??
      notification.otherParticipant?.candidate?.fullName ??
      "Quelqu'un";
    return (
      <Link
        to={`/candidat/messages?conversation=${notification.conversationId}`}
      >
        <Card className={cardClass}>
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {senderName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {notification.lastMessage.body}
                </p>
              </div>
            </div>
            <Badge variant="accent">Nouveau</Badge>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onRead} className="block w-full text-left">
      <Card className={cardClass}>
        <CardContent className="flex items-start justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {notification.senderName} vous a contacté
              </p>
              <p className="text-xs text-muted-foreground">
                À propos de « {notification.cvTitle} »
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {notification.message}
              </p>
            </div>
          </div>
          {unread && <Badge variant="accent">Nouveau</Badge>}
        </CardContent>
      </Card>
    </button>
  );
}

export default function CandidateNotificationsPage() {
  usePageMeta({
    title: "Mes notifications — Espace candidat FINAKOM",
    description:
      "Offres correspondant à votre profil et messages reçus sur FINAKOM.",
    path: "/candidat/notifications",
  });
  const { data: notifications, isLoading } = useCandidateNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-medium text-foreground">
        Mes notifications
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Les offres correspondant à vos CV publiés, et les messages que vous avez
        reçus.
      </p>

      <div className="mt-8">
        {isLoading && <LoadingState />}

        {notifications && notifications.length === 0 && (
          <EmptyState
            icon={Bell}
            message="Aucune notification pour le moment."
          />
        )}

        {notifications && notifications.length > 0 && (
          <div className="flex flex-col gap-3">
            {notifications.map((n) => (
              <NotificationCard
                key={`${n.type}-${n.id}`}
                notification={n}
                onRead={() =>
                  !n.readAt &&
                  n.type !== "new_message" &&
                  markRead.mutate({ id: n.id, type: n.type })
                }
              />
            ))}
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        <Link to="/candidat/tableau-de-bord" className="hover:text-foreground">
          ← Retour à mon espace
        </Link>
      </p>
    </div>
  );
}
