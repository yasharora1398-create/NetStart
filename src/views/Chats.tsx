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

  // Collapse-the-contacts state. Persisted per-device in localStorage
  // so re-opening Chats remembers the user's last preference. Only
  // applies on md+; on mobile the panes already swap via grid.
  const COLLAPSE_KEY = "polln8.chats.list_collapsed";
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
        {/* Desktop wraps the panes in a rounded card with side
            padding. Mobile goes full-bleed so the surface feels
            like a native chat screen instead of a browser tile.
            Negative margins on mobile escape AppLayout's <main>
            pt-12 / px-* so the list and conversation reach the
            screen edges. */}
        {/* Wrapper stretches edge-to-edge inside the sidebar-padded
            <main>. Previously it was capped at md:max-w-6xl which
            made the chat area look "crammed" on wide displays; now
            we let it fill the column the sidebar leaves us, with
            modest side padding for breathing room. */}
        <div className="-mx-4 -mt-12 md:m-0 md:px-4 lg:px-6">
          <div className="md:mx-auto md:w-full">
            <div
              className={cn(
                "grid overflow-hidden bg-card/40 transition-[grid-template-columns] duration-300 ease-out",
                "h-[calc(100dvh-84px)] min-h-[420px]",
                "md:rounded-2xl md:border md:border-border md:shadow-sm md:min-h-[520px] md:h-[calc(100vh-7rem)]",
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
                  // When the operator collapsed the list on desktop,
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
