import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCircle2, Inbox, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/lib/mynet-storage";
import type {
  AppNotification,
  NotificationType,
} from "@/lib/mynet-types";

const formatRelative = (iso: string): string => {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - d) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return new Date(iso).toLocaleDateString();
};

const iconFor = (type: NotificationType) => {
  switch (type) {
    case "application_accepted":
    case "profile_accepted":
      return CheckCircle2;
    case "application_rejected":
    case "profile_rejected":
      return XCircle;
    default:
      return Inbox;
  }
};

const colorFor = (type: NotificationType): string => {
  switch (type) {
    case "application_accepted":
    case "profile_accepted":
      return "text-emerald-400";
    case "application_rejected":
    case "profile_rejected":
      return "text-destructive";
    default:
      return "text-gold";
  }
};

export const NotificationsBell = () => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await listNotifications();
      setItems(list);
    } catch (err) {
      // silent — notification fetch errors shouldn't toast on every render
      void err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  const unread = items.filter((n) => !n.readAt);

  const handleClick = async (n: AppNotification) => {
    if (!n.readAt) {
      try {
        await markNotificationsRead([n.id]);
        setItems((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x,
          ),
        );
      } catch {
        // swallow
      }
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((x) =>
          x.readAt ? x : { ...x, readAt: new Date().toISOString() },
        ),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update.");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative h-9 w-9 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-gold text-obsidian text-[10px] font-mono font-semibold flex items-center justify-center">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-card border-border"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="font-mono text-[11px] uppercase tracking-widest text-gold">
            Notifications
          </p>
          {unread.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAll}
              className="h-7 px-2 text-[11px]"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 text-gold animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center">
              <Inbox className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => {
                const Icon = iconFor(n.type);
                const color = colorFor(n.type);
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-background/60 transition-colors flex gap-3 ${
                        !n.readAt ? "bg-gold/5" : ""
                      }`}
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70 flex-shrink-0">
                            {formatRelative(n.createdAt)}
                          </span>
                        </div>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {n.body}
                          </p>
                        )}
                      </div>
                      {!n.readAt && (
                        <span className="h-2 w-2 rounded-full bg-gold flex-shrink-0 mt-1.5" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
