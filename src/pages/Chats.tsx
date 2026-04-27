import { useEffect, useState } from "react";
import {
  Hourglass,
  Inbox,
  Loader2,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Nav } from "@/components/netstart/Nav";
import { Footer } from "@/components/netstart/Footer";
import { AuthGate } from "@/components/netstart/AuthGate";
import { useAuth } from "@/context/AuthContext";
import {
  listNotifications,
  markNotificationsRead,
} from "@/lib/mynet-storage";
import type { AppNotification } from "@/lib/mynet-types";

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
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingData(true);
    listNotifications(50)
      .then((list) => {
        if (cancelled) return;
        setItems(list);
        const unreadIds = list
          .filter((n) => n.type === "chat_request" && !n.readAt)
          .map((n) => n.id);
        if (unreadIds.length > 0) {
          markNotificationsRead(unreadIds).catch(() => {
            /* swallow; non-critical */
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
  const requests = items.filter((n) => n.type === "chat_request");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />

      <main
        className={`pt-28 pb-24 ${!isAuthed ? "pointer-events-none select-none blur-sm" : ""}`}
      >
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
              Chat requests land here first. Once you both connect, the thread
              moves into Active.
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
              <div className="rounded-sm border border-border bg-card/40 p-8 text-center">
                <Loader2 className="h-5 w-5 text-gold animate-spin mx-auto mb-3" />
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Loading...
                </p>
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-sm border border-dashed border-border bg-card/40 p-10 text-center">
                <Inbox className="h-6 w-6 text-gold mx-auto mb-3" />
                <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">
                  Empty
                </p>
                <h3 className="font-display text-2xl mb-2">No requests yet.</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  When a founder asks you to chat, or you ask one to look at
                  your profile, it will show up here.
                </p>
              </div>
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
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {r.body}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl">Active</h2>
            </div>
            <div className="rounded-sm border border-dashed border-border bg-card/40 p-10 text-center">
              <Hourglass className="h-6 w-6 text-gold mx-auto mb-3" />
              <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">
                Coming soon
              </p>
              <h3 className="font-display text-2xl mb-2">
                In-app messaging is on the way.
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                For now, accepted requests exchange contact info so you can
                connect over LinkedIn or email.
              </p>
            </div>
          </section>
        </div>
      </main>

      {!loading && !user && <AuthGate />}

      <Footer />
    </div>
  );
};

export default Chats;
