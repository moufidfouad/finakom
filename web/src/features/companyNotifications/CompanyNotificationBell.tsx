import { Link } from "react-router-dom";
import { Bell, MessageSquare, UserRound } from "lucide-react";
import {
  useCompanyNotifications,
  useMarkCompanyNotificationRead,
} from "./companyNotifications.api";
import { useCompanyNotificationsSocket } from "./useCompanyNotificationsSocket";
import { CompanyNotification } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PREVIEW_COUNT = 5;

function NotificationEntry({
  notification,
  companyId,
  onRead,
}: {
  notification: CompanyNotification;
  companyId: string;
  onRead: () => void;
}) {
  if (notification.type === "new_message") {
    const senderName =
      notification.otherParticipant?.company?.name ??
      notification.otherParticipant?.candidate?.fullName ??
      "Quelqu'un";
    return (
      <Link
        to={`/app/entreprises/${companyId}?tab=messages&conversation=${notification.conversationId}`}
        className="cursor-pointer flex-col items-start gap-0.5 py-2"
      >
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" /> {senderName}
        </span>
        <span className="line-clamp-1 pl-5 text-xs text-muted-foreground">
          {notification.lastMessage.body}
        </span>
      </Link>
    );
  }
  return (
    <Link
      to={`/app/entreprises/${companyId}?tab=job-postings`}
      onClick={onRead}
      className="cursor-pointer flex-col items-start gap-0.5 py-2"
    >
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <UserRound className="h-3.5 w-3.5 shrink-0" />{" "}
        {notification.jobApplication.candidate.fullName}
      </span>
      <span className="pl-5 text-xs text-muted-foreground">
        {notification.jobApplication.jobPosting.title}
      </span>
    </Link>
  );
}

/** Pendant entreprise de features/candidateNotifications/NotificationBell —
 * même patron visuel, mais scopée à UNE entreprise (companyId), cohérent
 * avec le backend qui n'expose pas de vue globale tous comptes confondus.
 * Fusionne candidatures et conversations non lues (même patron d'union
 * discriminée que côté candidat) — une conversation ne peut pas être marquée
 * lue via markCompanyNotificationRead (id n'est pas une vraie notification
 * d'application), le marquage se fait naturellement en ouvrant le fil. */
export default function CompanyNotificationBell({
  companyId,
}: {
  companyId: string;
}) {
  useCompanyNotificationsSocket(companyId);
  const { data: notifications } = useCompanyNotifications(companyId);
  const markRead = useMarkCompanyNotificationRead(companyId);

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;
  const preview = notifications?.slice(0, PREVIEW_COUNT) ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {preview.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Aucune notification pour le moment.
          </p>
        ) : (
          preview.map((n) => (
            <DropdownMenuItem
              key={`${n.type}-${n.id}`}
              asChild
              className={!n.readAt ? "bg-secondary/50" : undefined}
            >
              <NotificationEntry
                notification={n}
                companyId={companyId}
                onRead={() =>
                  !n.readAt && n.type !== "new_message" && markRead.mutate(n.id)
                }
              />
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
