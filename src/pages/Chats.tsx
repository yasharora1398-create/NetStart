/**
 * Chats — full-bleed two-column layout. Left rail: thread list with
 * search. Right pane: active conversation with realtime updates.
 *
 * URL drives selection: /chats shows the placeholder; /chats/:id
 * opens that thread. Selecting a thread navigates so deep links work
 * and the back button does the right thing.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, MessageCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AppLayout } from "@/components/netstart/AppLayout";
import { AuthGate } from "@/components/netstart/AuthGate";
import { useAuth } from "@/context/AuthContext";
import { useReviewStatus } from "@/hooks/useReviewStatus";
import {
  getCandidatesByIds,
  listChatThreads,
  type ChatThreadSummary,
} from "@/lib/mynet-storage";
import {
  ChatThreadList,
  mergeThreadProfiles,
  type ThreadListItem,
} from "@/components/chat/ChatThreadList";
import { ChatConversation } from "@/components/chat/ChatConversation";
import { cn } from "@/lib/utils";

const Chats = () => {
  const { user, loading } = useAuth();
  const reviewStatus = useReviewStatus();
  const needsSetup =
    Boolean(user) && reviewStatus !== null && reviewStatus !== "accepted";
  const { id: routeContactId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [profiles, setProfiles] = useState<Map<string, { fullName: string; avatarPath: string | null }>>(
    () => new Map(),
  );
  const [loadingThreads, setLoadingThreads] = useState(true);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    if (!user) return;
    setLoadingThreads(true);
    setLoadError(null);
    try {
      const ts = await listChatThreads();
      setThreads(ts);
      const ids = ts.map((t) => t.contactId);
      if (ids.length > 0) {
        try {
          const cands = await getCandidatesByIds(ids);
          const next = new Map<string, { fullName: string; avatarPath: string | null }>();
          for (const c of cands) {
            next.set(c.userId, {
              fullName: c.fullName,
              avatarPath: c.avatarPath,
            });
          }
          setProfiles(next);
        } catch (err) {
          // Profile fetch failed — rows still render with raw names.
          // Logged so we can see it in the dev console.
          console.error("getCandidatesByIds failed:", err);
        }
      }
    } catch (err) {
      // Surface the underlying Supabase error so we can debug missing
      // RPCs / RLS issues instead of silently showing an empty state.
      console.error("listChatThreads failed:", err);
      const msg =
        err instanceof Error
          ? err.message
          : err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message ?? "")
            : "Unknown error";
      setLoadError(msg || "Could not load conversations.");
    } finally {
      setLoadingThreads(false);
    }
  }, [user]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  // If the route id isn't already in the threads list (e.g. user
  // landed via a deep link or just clicked Message on a profile), we
  // still want a row at the top so they can see who they're talking
  // to. We synthesize a placeholder thread row.
  const items: ThreadListItem[] = useMemo(() => {
    const merged = mergeThreadProfiles(
      threads,
      Array.from(profiles.entries()).map(([userId, p]) => ({
        userId,
        fullName: p.fullName,
        linkedinUrl: "",
        headline: "",
        bio: "",
        skills: [],
        location: "",
        commitment: "",
        resumeName: null,
        resumePath: null,
        avatarPath: p.avatarPath,
      })),
    );
    if (
      routeContactId &&
      !merged.some((t) => t.contactId === routeContactId)
    ) {
      merged.unshift({
        contactId: routeContactId,
        lastBody: "",
        lastAt: null,
        lastSender: null,
        state: "none",
        acceptedAt: null,
        fullName: profiles.get(routeContactId)?.fullName ?? "",
        avatarPath: profiles.get(routeContactId)?.avatarPath ?? null,
      });
    }
    return merged;
  }, [threads, profiles, routeContactId]);

  const selected = useMemo(
    () => items.find((t) => t.contactId === routeContactId) ?? null,
    [items, routeContactId],
  );

  return (
    <AppLayout>
      <AuthGate
        authLoading={loading}
        signedIn={Boolean(user)}
        needsSetup={needsSetup}
        authTitle="Sign in to chat"
        authBody="Conversations live with your account so we can keep the thread going across devices."
        setupTitle="Finish setting up MyNet to chat."
        setupBody="Chat unlocks once your MyNet profile is set up. It only takes a minute."
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div
              className={cn(
                "grid h-[calc(100vh-9rem)] min-h-[520px] overflow-hidden rounded-2xl border border-border bg-card/40 shadow-sm",
                // One column on mobile, two on md+. On mobile we hide
                // whichever pane isn't relevant (list when a thread
                // is open, pane when not).
                "md:grid-cols-[320px_1fr]",
              )}
            >
              <div
                className={cn(
                  "min-h-0",
                  selected ? "hidden md:flex md:flex-col" : "flex flex-col",
                )}
              >
                <ChatThreadList
                  items={items}
                  selectedId={routeContactId ?? null}
                  currentUserId={user?.id ?? null}
                  loading={loadingThreads}
                  onSelect={(id) => navigate(`/chats/${id}`)}
                />
              </div>
              <div
                className={cn(
                  "min-h-0",
                  selected ? "flex flex-col" : "hidden md:flex md:flex-col",
                )}
              >
                {selected && user ? (
                  <ChatConversation
                    key={selected.contactId}
                    contactId={selected.contactId}
                    currentUserId={user.id}
                    initialProfile={
                      selected.fullName || selected.avatarPath
                        ? {
                            fullName: selected.fullName,
                            headline: "",
                            avatarPath: selected.avatarPath,
                            linkedinUrl: "",
                          }
                        : null
                    }
                    onThreadsChanged={loadThreads}
                    onThreadDeleted={() => {
                      setThreads((prev) =>
                        prev.filter((t) => t.contactId !== selected.contactId),
                      );
                      navigate("/chats");
                    }}
                  />
                ) : loadError ? (
                  <ErrorPanel message={loadError} onRetry={loadThreads} />
                ) : (
                  <Placeholder />
                )}
              </div>
            </div>
          </div>
        </div>
      </AuthGate>
    </AppLayout>
  );
};

const Placeholder = () => (
  <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
    <MessageCircle className="size-6 text-muted-foreground" aria-hidden />
    <p className="font-display text-base text-foreground">
      Select a conversation
    </p>
    <p className="max-w-sm text-sm text-muted-foreground">
      Pick a thread on the left to read it, or open someone's profile to
      start a new one.
    </p>
  </div>
);

// Surfaces the actual server error so we can debug missing RPCs and
// RLS denials instead of silently rendering empty space. Most common
// hits here are migrations 0019/0020 not applied (PGRST202) and the
// realtime publication missing chat_messages.
const ErrorPanel = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
    <AlertCircle className="size-6 text-destructive" aria-hidden />
    <p className="font-display text-base text-foreground">
      Couldn't load conversations
    </p>
    <p className="max-w-md text-sm text-muted-foreground break-words">
      {message}
    </p>
    <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
      <RefreshCw className="size-3.5" />
      Retry
    </Button>
  </div>
);

export default Chats;
