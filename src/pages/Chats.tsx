import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Check,
  ExternalLink,
  Inbox,
  Linkedin,
  Loader2,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/netstart/AppLayout";
import { AuthGate } from "@/components/netstart/AuthGate";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  acceptChatRequest,
  getAvatarUrl,
  listChatContacts,
  listNotifications,
  markNotificationsRead,
} from "@/lib/mynet-storage";
import type { AppNotification, ChatContact } from "@/lib/mynet-types";

const initials = (name: string): string => {
  if (!name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};

const formatWhen = (iso: string): string => {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const min = Math.round(diff / 60_000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const h = Math.round(min / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.round(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
};

const Chats = () => {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const refresh = async () => {
    setLoadingData(true);
    try {
      const [list, c] = await Promise.all([
        listNotifications(50),
        listChatContacts().catch(() => [] as ChatContact[]),
      ]);
      setItems(list);
      setContacts(c);
      const unreadIds = list
        .filter((n) => n.type === "chat_request" && !n.readAt)
        .map((n) => n.id);
      if (unreadIds.length > 0) {
        markNotificationsRead(unreadIds).catch(() => {
          /* swallow */
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingData(true);
    Promise.all([
      listNotifications(50),
      listChatContacts().catch(() => [] as ChatContact[]),
    ])
      .then(([list, c]) => {
        if (cancelled) return;
        setItems(list);
        setContacts(c);
        const unreadIds = list
          .filter((n) => n.type === "chat_request" && !n.readAt)
          .map((n) => n.id);
        if (unreadIds.length > 0) {
          markNotificationsRead(unreadIds).catch(() => {
            /* swallow */
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isAuthed = Boolean(user) && !loading;
  // Hide chat requests from contacts we've already accepted, so the
  // request doesn't linger after Accept.
  const acceptedIds = new Set(contacts.map((c) => c.contactId));
  const requests = items.filter(
    (n) =>
      n.type === "chat_request" &&
      (n.fromUserId == null || !acceptedIds.has(n.fromUserId)),
  );

  const handleAccept = async (n: AppNotification) => {
    if (acceptingId) return;
    setAcceptingId(n.id);
    try {
      await acceptChatRequest(n.id);
      toast.success("Chat accepted. They're now in your DMs.");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept.");
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <AppLayout blurred={!isAuthed}>
        <div className="container max-w-3xl">
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold-soft bg-gold/5 mb-6">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">
                Chats
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl leading-[1] mb-4">
              Conversations.
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Chat requests land in Requests. Once you accept, they show up in
              your DMs.
            </p>
          </header>

          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl">
                Requests{" "}
                <span className="text-muted-foreground">
                  ({requests.length})
                </span>
              </h2>
            </div>

            {loadingData ? (
              <Loading />
            ) : requests.length === 0 ? (
              <Empty
                icon={<Inbox className="h-6 w-6 text-gold mx-auto mb-3" />}
                title="No requests yet."
                body="When a founder asks you to chat, or you ask one to look at your profile, it will show up here."
              />
            ) : (
              <ul className="space-y-3">
                {requests.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-sm border border-border bg-card hover:border-gold/40 transition-colors p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="h-4 w-4 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <h3 className="font-display text-lg leading-tight">
                            {r.title}
                          </h3>
                          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex-shrink-0">
                            {formatWhen(r.createdAt)}
                          </span>
                        </div>
                        {r.body && (
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mb-4">
                            {r.body}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {r.fromUserId ? (
                            <Link to={`/u/${r.fromUserId}`}>
                              <Button variant="outlineGold" size="sm">
                                <Briefcase className="h-4 w-4" />
                                Check out their business
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              variant="outlineGold"
                              size="sm"
                              disabled
                              title="Sender info missing on this request"
                            >
                              <Briefcase className="h-4 w-4" />
                              Check out their business
                            </Button>
                          )}
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => handleAccept(r)}
                            disabled={
                              acceptingId === r.id || r.fromUserId == null
                            }
                          >
                            {acceptingId === r.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Accepting...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                Accept chat
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl">
                DMs{" "}
                <span className="text-muted-foreground">
                  ({contacts.length})
                </span>
              </h2>
            </div>

            {contacts.length === 0 ? (
              <Empty
                icon={
                  <MessageCircle className="h-6 w-6 text-gold mx-auto mb-3" />
                }
                title="No contacts yet."
                body="Accept a chat request and they'll show up here. In-app messaging is coming soon — for now, reach out via LinkedIn."
              />
            ) : (
              <ul className="space-y-3">
                {contacts.map((c) => {
                  const avatar = getAvatarUrl(c.avatarPath);
                  return (
                    <li
                      key={c.contactId}
                      className="rounded-sm border border-border bg-card hover:border-gold/40 transition-colors p-5"
                    >
                      <div className="flex items-center gap-4">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={c.fullName}
                            className="h-12 w-12 rounded-sm object-cover border border-gold/40 flex-shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-sm bg-gold/10 border border-gold/40 flex items-center justify-center flex-shrink-0">
                            <span className="font-display text-base text-gold">
                              {initials(c.fullName)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-lg leading-tight truncate">
                            {c.fullName || "Unnamed"}
                          </h3>
                          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                            Connected {formatWhen(c.connectedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link to={`/u/${c.contactId}`}>
                            <Button variant="ghost" size="sm">
                              <Briefcase className="h-4 w-4" />
                              View
                            </Button>
                          </Link>
                          {c.linkedinUrl && (
                            <a
                              href={c.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outlineGold" size="sm">
                                <Linkedin className="h-4 w-4" />
                                Message
                                <ExternalLink className="h-3 w-3 opacity-60" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

      {!loading && !user && <AuthGate />}
    </AppLayout>
  );
};

const Loading = () => (
  <div className="rounded-sm border border-border bg-card/40 p-8 text-center">
    <Loader2 className="h-5 w-5 text-gold animate-spin mx-auto mb-3" />
    <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
      Loading...
    </p>
  </div>
);

const Empty = ({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) => (
  <div className="rounded-sm border border-dashed border-border bg-card/40 p-10 text-center">
    {icon}
    <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">
      Empty
    </p>
    <h3 className="font-display text-2xl mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-md mx-auto">{body}</p>
  </div>
);

export default Chats;
