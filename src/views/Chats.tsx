"use client";
/**
 * Chats — full-bleed two-column layout. Left rail: thread list with
 * search. Right pane: active conversation with realtime updates.
 *
 * URL drives selection: /chats shows the placeholder; /chats/:id
 * opens that thread. Selecting a thread navigates so deep links work
 * and the back button does the right thing.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "@/lib/router-compat";
import {
  AlertCircle,
  PanelLeftOpen,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { AppLayout } from "@/components/netstart/AppLayout";
import { AuthGate } from "@/components/netstart/AuthGate";
import { MothEmptyState } from "@/components/netstart/MothEmptyState";
import { useAuth } from "@/context/AuthContext";
import { useReviewStatus } from "@/hooks/useReviewStatus";
import {
  getCandidatesByIds,
  listChatThreads,
  type ChatThreadSummary,
} from "@/lib/mynet-storage";
import { getSupabase } from "@/lib/supabase";
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
  // Hydrate from localStorage on mount so the thread list shows up
  // immediately on subsequent visits instead of waiting on the two
  // sequential Supabase RPCs (list_chat_threads + get_candidates_by_ids).
  // Stale-while-revalidate: cached state renders first, fresh data
  // overwrites it when the network calls land.
  const cacheKeyFor = (uid: string | undefined, suffix: string) =>
    uid ? `polln8.chats.${suffix}.${uid}` : null;
  const readCachedThreads = (uid: string | undefined): ChatThreadSummary[] => {
    if (typeof window === "undefined") return [];
    const key = cacheKeyFor(uid, "threads");
    if (!key) return [];
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as ChatThreadSummary[]) : [];
    } catch {
      return [];
    }
  };
  const readCachedProfiles = (
    uid: string | undefined,
  ): Map<string, { fullName: string; avatarPath: string | null }> => {
    if (typeof window === "undefined") return new Map();
    const key = cacheKeyFor(uid, "profiles");
    if (!key) return new Map();
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return new Map();
      const obj = JSON.parse(raw) as Record<
        string,
        { fullName: string; avatarPath: string | null }
      >;
      return new Map(Object.entries(obj));
    } catch {
      return new Map();
    }
  };

  const [threads, setThreads] = useState<ChatThreadSummary[]>(() =>
    readCachedThreads(user?.id),
  );
  const [profiles, setProfiles] = useState<
    Map<string, { fullName: string; avatarPath: string | null }>
  >(() => readCachedProfiles(user?.id));
  // Only show the spinner on the very first visit (no cache present);
  // refreshes happen in the background while existing rows stay visible.
  const [loadingThreads, setLoadingThreads] = useState<boolean>(() => {
    return readCachedThreads(user?.id).length === 0;
  });

  const [loadError, setLoadError] = useState<string | null>(null);

  // Auth-hydration race: on a hard page reload, `user` is null for
  // ~200ms while AuthContext loads the session from storage. The
  // useState initializers above ran with user.id === undefined, so
  // the cache lookup returned empty and the user saw a spinner anyway.
  // This effect re-runs the cache lookup the moment the user becomes
  // known, so a returning visitor sees their threads instantly.
  useEffect(() => {
    if (!user?.id) return;
    if (threads.length > 0) return; // already populated (either from
                                    // the initial cache hit when user
                                    // was known, or from a fresh load)
    const cached = readCachedThreads(user.id);
    const cachedProfiles = readCachedProfiles(user.id);
    if (cached.length > 0) {
      setThreads(cached);
      setProfiles(cachedProfiles);
      setLoadingThreads(false);
    }
    // The full network refresh still runs via the loadThreads
    // effect below; this only patches the empty-while-loading window.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Collapse-the-contacts state. Per-user key so two people sharing
  // a laptop don't share collapse preferences (was global before).
  const COLLAPSE_KEY = user?.id
    ? `polln8.chats.list_collapsed.${user.id}`
    : "polln8.chats.list_collapsed";
  const [listCollapsed, setListCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, listCollapsed ? "1" : "0");
    } catch {
      // ignore (private mode)
    }
  }, [listCollapsed]);
  const toggleList = useCallback(
    () => setListCollapsed((c) => !c),
    [],
  );

  const loadThreads = useCallback(async () => {
    if (!user) return;
    // Only flip the spinner if we have nothing to show. With a cache
    // hit the existing rows stay on screen while the refresh runs.
    if (threads.length === 0) setLoadingThreads(true);
    setLoadError(null);
    try {
      const ts = await listChatThreads();
      setThreads(ts);
      // Persist for next mount so the user gets an instant render.
      try {
        const key = cacheKeyFor(user.id, "threads");
        if (key) window.localStorage.setItem(key, JSON.stringify(ts));
      } catch {
        // ignore (private mode)
      }
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
          try {
            const key = cacheKeyFor(user.id, "profiles");
            if (key)
              window.localStorage.setItem(
                key,
                JSON.stringify(Object.fromEntries(next)),
              );
          } catch {
            // ignore
          }
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

  // Realtime: re-run loadThreads whenever a chat_messages row for me
  // (sender or recipient) is inserted or updated. Without this, the
  // thread list only refreshed on initial mount + manual reload, so
  // an incoming message while you were staring at the contacts list
  // didn't bump the row, didn't update the preview, didn't show an
  // unread badge until you clicked away and back.
  //
  // Debounced so a burst of messages from one sender doesn't fire
  // listChatThreads dozens of times -- one trailing refresh is enough.
  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    const sb = getSupabase();
    let refreshTimer: number | null = null;
    const queueRefresh = () => {
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        void loadThreads();
      }, 350);
    };
    const involvesMe = (row: { sender_id: string | null; recipient_id: string | null }) =>
      row.sender_id === uid || row.recipient_id === uid;
    const channel = sb
      .channel(`chats-list:${uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          if (involvesMe(payload.new as { sender_id: string | null; recipient_id: string | null }))
            queueRefresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages" },
        (payload) => {
          if (involvesMe(payload.new as { sender_id: string | null; recipient_id: string | null }))
            queueRefresh();
        },
      )
      .subscribe();
    return () => {
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      void sb.removeChannel(channel);
    };
  }, [user?.id, loadThreads]);

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
        {/* Full-bleed chat surface. Negative margins escape every
            ancestor that adds padding (AppLayout's <main> pt-12 +
            px-*, the inner container, etc.) so the conversation
            and thread list reach the literal edges of what the
            sidebar leaves us -- no floating "rectangle in the
            middle of the page" feel. The dropped border / radius /
            shadow on md+ is the rest of that change: bordered
            cards look like containers, edge-to-edge feels like a
            real app. */}
        <div className="-mx-4 -mt-12 md:m-0">
          <div className="w-full">
            <div
              className={cn(
                "grid overflow-hidden bg-card/40 transition-[grid-template-columns] duration-300 ease-out",
                "h-[calc(100dvh-84px)] min-h-[420px]",
                "md:min-h-[520px] md:h-[calc(100vh-3rem)]",
                // One column on mobile (panes swap via display). On
                // md+ two columns when expanded; one column when the
                // contacts list is collapsed so the conversation
                // takes the full width.
                listCollapsed
                  ? "md:grid-cols-[1fr]"
                  : "md:grid-cols-[320px_1fr]",
              )}
            >
              <div
                className={cn(
                  "min-h-0 flex-col",
                  selected ? "hidden md:flex" : "flex md:flex",
                  // When the builder collapsed the list on desktop,
                  // hide the pane entirely so the conversation takes
                  // the full width. Mobile rules still control visibility
                  // based on whether a thread is selected.
                  listCollapsed && "md:hidden",
                )}
              >
                <ChatThreadList
                  items={items}
                  selectedId={routeContactId ?? null}
                  currentUserId={user?.id ?? null}
                  loading={loadingThreads}
                  onSelect={(id) => navigate(`/chats/${id}`)}
                  /* The header in the list itself gets a collapse
                     button so users on desktop have a familiar
                     "tuck this panel away" affordance. */
                  onCollapse={toggleList}
                />
              </div>
              <div
                className={cn(
                  "relative min-h-0",
                  selected ? "flex flex-col" : "hidden md:flex md:flex-col",
                )}
              >
                {/* Re-show-contacts button. Floats over the chat
                    conversation header on desktop when the list is
                    hidden. On mobile this button doesn't render
                    because the list-swap is handled by route state. */}
                {listCollapsed && (
                  <button
                    type="button"
                    onClick={toggleList}
                    aria-label="Show contacts"
                    className="hidden md:inline-flex absolute left-3 top-3 z-10 h-8 w-8 items-center justify-center rounded-sm border border-border bg-card/90 text-muted-foreground hover:text-foreground hover:bg-card transition-colors backdrop-blur"
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </button>
                )}
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
  // Uses the same hummingbird-hawk-moth empty-state language as
  // Match / Saved / Applications. The "threads" variant draws the
  // top-down envelope-on-a-desk scene with the moth rising out --
  // perfect cue for "pick a thread to open it."
  <div className="flex h-full items-center justify-center px-4">
    <MothEmptyState
      variant="threads"
      title="Select a conversation"
      sub="Pick a thread on the left to read it, or open someone's profile to start a new one."
    />
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
