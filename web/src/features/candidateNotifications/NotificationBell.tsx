import { Link } from "react-router-dom";
import { Bell, Briefcase, Mail, MessageSquare } from "lucide-react";
import {
  useCandidateNotifications,
  useMarkNotificationRead,
} from "./candidateNotifications.api";
import { useCandidateNotificationsSocket } from "./useCandidateNotificationsSocket";
import { CandidateJobNotification } from "@/types";
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
  onRead,
}: {
  notification: CandidateJobNotification;
  onRead: () => void;
}) {
  if (notification.type === "job_match") {
    return (
      <Link
        to={`/offres/${notification.jobPostingId}`}
        onClick={onRead}
        className="cursor-pointer flex-col items-start gap-0.5 py-2"
      >
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Briefcase className="h-3.5 w-3.5 shrink-0" />{" "}
          {notification.jobPosting.title}
        </span>
        <span className="pl-5 text-xs text-muted-foreground">
          {notification.jobPosting.company.name}
        </span>
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
    <button
      type="button"
      onClick={onRead}
      className="flex w-full cursor-pointer flex-col items-start gap-0.5 py-2 text-left"
    >
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Mail className="h-3.5 w-3.5 shrink-0" /> {notification.senderName}
      </span>
      <span className="line-clamp-1 pl-5 text-xs text-muted-foreground">
        {notification.message}
      </span>
    </button>
  );
}

export default function NotificationBell() {
  useCandidateNotificationsSocket();
  const { data: notifications } = useCandidateNotifications();
  const markRead = useMarkNotificationRead();

  const unreadCount = notifications?.filter((n) => !n.readAt).length ?? 0;
  const preview = notifications?.slice(0, PREVIEW_COUNT) ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
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
                onRead={() =>
                  !n.readAt &&
                  n.type !== "new_message" &&
                  markRead.mutate({ id: n.id, type: n.type })
                }
              />
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to="/candidat/notifications"
            className="cursor-pointer justify-center text-sm font-medium text-accent"
          >
            Voir toutes les notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
