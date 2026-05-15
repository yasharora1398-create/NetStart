/**
 * The active-conversation pane for /chats/:id. Fetches the thread,
 * subscribes to realtime updates, renders messages with day dividers
 * and read receipts, and exposes a composer that obeys the Stage 4
 * pending-thread send rules:
 *
 *   - state="inbound"  → big Accept/Decline banner; sending blocked
 *                        until the recipient acts.
 *   - state="outbound" → composer enabled but capped at 2 messages
 *                        per 48h. Counter shown above the composer.
 *   - state="accepted" → unrestricted send.
 *   - state="declined" → messages blur + a Delete-thread CTA. Send
 *                        is hidden.
 *
 * Read-receipt + delivered ticks are upserted by the realtime UPDATE
 * stream so a sender's "read" tick lights up live the moment the
 * recipient opens the conversation.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Link } from "@/lib/router-compat";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ExternalLink,
  Linkedin,
  Mail,
  MoreVertical,
  Search as SearchIcon,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";
import {
  acceptChatThread,
  declineChatThread,
  deleteChatThread,
  getAvatarUrl,
  getChatThreadState,
  getPublicFounder,
  listChatThread,
  markMessagesDelivered,
  markMessagesRead,
  markNotificationsReadForSender,
  requestOrSendChatMessage,
  type ChatMessage,
  type ChatThreadState,
  type ThreadState,
} from "@/lib/mynet-storage";
import type { Candidate } from "@/lib/mynet-types";
import { markThreadUnread } from "@/lib/threadUnread";
import { ReportUserButton } from "@/components/netstart/ReportUserButton";
import { dayKey, formatDayDivider, formatTime } from "./ChatTime";

const initials = (name: string): string => {
  if (!name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};

type CounterpartyProfile = {
  fullName: string;
  headline: string;
  avatarPath: string | null;
  linkedinUrl: string;
};

type Props = {
  contactId: string;
  currentUserId: string;
  /**
   * Profile snapshot from the thread list. Used as a fallback while
   * the full profile fetch is in flight so the header doesn't
   * flicker. Nullable when the chat is opened from a deep link with
   * no thread row available yet.
   */
  initialProfile: CounterpartyProfile | null;
  onThreadsChanged: () => void;
  onThreadDeleted: () => void;
};

export const ChatConversation = ({
  contactId,
  currentUserId,
  initialProfile,
  onThreadsChanged,
  onThreadDeleted,
}: Props) => {
  const [profile, setProfile] = useState<CounterpartyProfile | null>(
    initialProfile,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadState, setThreadState] = useState<ChatThreadState>({
    state: "none",
    acceptedAt: null,
    pendingCount: 0,
    pendingWindowStartAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState<"accept" | "decline" | "delete" | null>(
    null,
  );
  const [draft, setDraft] = useState("");
  // Local in-thread message search. Toggled by the magnifying-glass
  // icon in the header; filters the visible messages by case-
  // insensitive substring match. Cleared when the user navigates to
  // a different thread.
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Track whether we should auto-scroll on the next message — only
  // when the user is already near the bottom of the thread.
  const stickToBottomRef = useRef(true);

  // Reset UI when contact changes so the previous thread doesn't
  // flash through.
  //
  // CRITICAL: deps are [contactId] only, NOT [contactId, initialProfile].
  // The parent passes a freshly-allocated initialProfile object literal
  // on every render (see Chats.tsx). Including it in deps caused this
  // effect to re-fire after every send (handleSend -> onThreadsChanged
  // -> parent setThreads -> parent re-render -> new initialProfile
  // reference -> effect fires -> setMessages([]) wipes the optimistic
  // message and the user saw a blank thread instead of the message
  // they just sent.
  useEffect(() => {
    setProfile(initialProfile);
    setMessages([]);
    setThreadState({
      state: "none",
      acceptedAt: null,
      pendingCount: 0,
      pendingWindowStartAt: null,
    });
    setDraft("");
    setSearchOpen(false);
    setSearchQuery("");
    setLoading(true);
    stickToBottomRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  // Filtered view of the messages for the open thread. When the
  // search bar is empty (or closed), the full list passes through.
  const visibleMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!searchOpen || !q) return messages;
    return messages.filter((m) => m.body.toLowerCase().includes(q));
  }, [messages, searchOpen, searchQuery]);

  // Initial load: thread state + messages + (full) counterparty
  // profile. Profile fetch falls back to the candidate / founder RPCs;
  // we use whichever returns first.
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [state, msgs] = await Promise.all([
        getChatThreadState(contactId),
        listChatThread(contactId),
      ]);
      setThreadState(state);
      setMessages(msgs);
      // Mark inbound messages delivered + read on view, plus any
      // chat-request / accept / decline notifications from this
      // sender so the bell badge clears once the thread is open.
      await Promise.allSettled([
        markMessagesDelivered(contactId),
        markMessagesRead(contactId),
        markNotificationsReadForSender(contactId),
      ]);
    } catch (err) {
      // soft-fail; the empty-state will render
      console.error("chat reload failed", err);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Counterparty profile — we don't know if the contact is a builder
  // or founder, so try the founder RPC first (cheap; returns null
  // fast when not a founder), then fall back to the candidate row.
  // Extracted so the realtime subscription below can re-fire it when
  // the counterparty edits their MyNet profile mid-conversation.
  const loadProfile = useCallback(async () => {
    try {
      const f = await getPublicFounder(contactId).catch(() => null);
      if (f) {
        setProfile({
          fullName: f.fullName,
          headline: f.headline,
          avatarPath: f.avatarPath,
          linkedinUrl: f.linkedinUrl,
        });
        return;
      }
      const sb = getSupabase();
      const { data } = await sb.rpc("get_candidates_by_ids", {
        ids: [contactId],
      });
      const row = (data ?? [])[0] as
        | {
            full_name: string;
            headline: string;
            avatar_path: string | null;
            linkedin_url: string;
          }
        | undefined;
      if (row) {
        setProfile({
          fullName: row.full_name ?? "",
          headline: row.headline ?? "",
          avatarPath: row.avatar_path ?? null,
          linkedinUrl: row.linkedin_url ?? "",
        });
      }
    } catch {
      // silent — the initialProfile (from the thread list) carries us
    }
  }, [contactId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await loadProfile();
    })();
    return () => {
      cancelled = true;
    };
  }, [contactId, loadProfile]);

  // Realtime: re-fetch the counterparty profile when their MyNet
  // row changes. Without this, edits the other side makes during
  // the conversation (name, headline, avatar) only become visible
  // on a manual refresh. Requires `profiles` to be in the
  // supabase_realtime publication; the subscription is a no-op
  // otherwise so this is safe to add either way.
  useEffect(() => {
    const sb = getSupabase();
    const channel = sb
      .channel(`profile:${contactId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${contactId}`,
        },
        () => {
          void loadProfile();
        },
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [contactId, loadProfile]);

  // Realtime subscription. Listens to INSERT and UPDATE on
  // chat_messages for any row where (sender, recipient) is one of the
  // two ordered pairs that involve me + contactId.
  useEffect(() => {
    if (!currentUserId) return;
    const sb = getSupabase();
    const channel = sb.channel(`chat:${currentUserId}:${contactId}`);
    const isThisThread = (row: {
      sender_id: string;
      recipient_id: string;
    }) =>
      (row.sender_id === currentUserId && row.recipient_id === contactId) ||
      (row.sender_id === contactId && row.recipient_id === currentUserId);

    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string;
            recipient_id: string;
            body: string;
            created_at: string;
            delivered_at: string | null;
            read_at: string | null;
          };
          if (!isThisThread(row)) return;
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === row.id);
            // If the message is already in the list (we got there
            // via an optimistic insert from handleSend), replace it
            // with the server version so we pick up the authoritative
            // createdAt / delivered_at / read_at. Earlier code returned
            // prev unchanged here, which left the optimistic
            // wall-clock createdAt in place forever -- a slow / skewed
            // client clock could push the message out of order in
            // the rendered thread until refresh.
            if (idx >= 0) {
              const next = prev.slice();
              next[idx] = {
                id: row.id,
                senderId: row.sender_id,
                recipientId: row.recipient_id,
                body: row.body,
                createdAt: row.created_at,
                deliveredAt: row.delivered_at,
                readAt: row.read_at,
              };
              return next;
            }
            return [
              ...prev,
              {
                id: row.id,
                senderId: row.sender_id,
                recipientId: row.recipient_id,
                body: row.body,
                createdAt: row.created_at,
                deliveredAt: row.delivered_at,
                readAt: row.read_at,
              },
            ];
          });
          // Refresh thread state in case this is the first message of a
          // new pending thread (so the banner / counter render).
          void getChatThreadState(contactId)
            .then(setThreadState)
            .catch(() => {});
          onThreadsChanged();
          // If the new message was for me, mark delivered + read so
          // the sender's ticks update right away.
          if (row.recipient_id === currentUserId) {
            void markMessagesDelivered(contactId).catch(() => {});
            void markMessagesRead(contactId).catch(() => {});
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages" },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string;
            recipient_id: string;
            delivered_at: string | null;
            read_at: string | null;
          };
          if (!isThisThread(row)) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === row.id
                ? { ...m, deliveredAt: row.delivered_at, readAt: row.read_at }
                : m,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [contactId, currentUserId, onThreadsChanged]);

  // Auto-scroll to bottom when messages change — but only if the
  // user was already near the bottom (don't yank them down while
  // they're scrolling up to read history).
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const result = await requestOrSendChatMessage(contactId, body);
      // Optimistic insert — realtime will dedupe via the id check.
      setMessages((prev) =>
        prev.some((m) => m.id === result.messageId)
          ? prev
          : [
              ...prev,
              {
                id: result.messageId,
                senderId: currentUserId,
                recipientId: contactId,
                body,
                createdAt: new Date().toISOString(),
                deliveredAt: null,
                readAt: null,
              },
            ],
      );
      setDraft("");
      stickToBottomRef.current = true;
      // Refresh thread state so the pending counter reflects the
      // new send.
      const state = await getChatThreadState(contactId);
      setThreadState(state);
      onThreadsChanged();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message.toLowerCase() : String(err);
      if (msg.includes("limit_reached")) {
        toast.error(
          "You've used both messages this round. Wait for them to accept, or check back in 48 hours.",
        );
      } else if (msg.includes("rate_limited")) {
        toast.error("Too many messages today. Try again tomorrow.");
      } else {
        toast.error(err instanceof Error ? err.message : "Could not send.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async () => {
    setBusy("accept");
    try {
      await acceptChatThread(contactId);
      const state = await getChatThreadState(contactId);
      setThreadState(state);
      onThreadsChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not accept.");
    } finally {
      setBusy(null);
    }
  };

  const handleDecline = async () => {
    setBusy("decline");
    try {
      await declineChatThread(contactId);
      const state = await getChatThreadState(contactId);
      setThreadState(state);
      onThreadsChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not decline.");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Delete this conversation? It'll be removed from your list.",
      )
    ) {
      return;
    }
    setBusy("delete");
    try {
      await deleteChatThread(contactId);
      onThreadDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete.");
    } finally {
      setBusy(null);
    }
  };

  const onComposerKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const isDeclined = threadState.state === "declined";
  const isInbound = threadState.state === "inbound";
  const isOutboundPending = threadState.state === "outbound";
  const sendDisabled =
    sending || draft.trim().length === 0 || isDeclined || isInbound;

  const url = profile ? getAvatarUrl(profile.avatarPath) : null;

  return (
    <section className="flex h-full min-h-0 flex-col">
      <Header
        profile={profile}
        url={url}
        contactId={contactId}
        onDelete={handleDelete}
        deleting={busy === "delete"}
        searchOpen={searchOpen}
        onToggleSearch={() => {
          setSearchOpen((v) => {
            if (v) setSearchQuery("");
            return !v;
          });
        }}
      />

      {searchOpen ? (
        <div className="flex items-center gap-2 border-b border-border bg-card/30 px-4 py-2 sm:px-6">
          <SearchIcon
            className="size-3.5 flex-shrink-0 text-muted-foreground"
            aria-hidden
          />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages in this thread"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {searchQuery.trim() ? `${visibleMessages.length} match${visibleMessages.length === 1 ? "" : "es"}` : ""}
          </span>
        </div>
      ) : null}

      {isInbound ? (
        <InboundBanner
          name={profile?.fullName.split(" ")[0] ?? "them"}
          onAccept={handleAccept}
          onDecline={handleDecline}
          busy={busy}
        />
      ) : null}

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8",
          isDeclined && "pointer-events-none select-none blur-sm opacity-60",
        )}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Loading...
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm font-medium text-foreground">
              {searchOpen && searchQuery.trim()
                ? "No matches."
                : "No messages yet."}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {searchOpen && searchQuery.trim()
                ? "Nothing in this thread matches that. Try fewer words."
                : "Say hi. Your first message creates the thread."}
            </p>
          </div>
        ) : (
          <MessageList
            messages={visibleMessages}
            currentUserId={currentUserId}
          />
        )}
      </div>

      {isDeclined ? (
        <DeclinedFooter
          onDelete={handleDelete}
          deleting={busy === "delete"}
        />
      ) : (
        <Composer
          draft={draft}
          onChange={setDraft}
          onKeyDown={onComposerKey}
          onSend={handleSend}
          disabled={sendDisabled}
          sending={sending}
          state={threadState.state}
          pendingCount={threadState.pendingCount}
          pendingWindowStartAt={threadState.pendingWindowStartAt}
          isInbound={isInbound}
          isOutboundPending={isOutboundPending}
        />
      )}
    </section>
  );
};

// ─── header ────────────────────────────────────────────────────────

const Header = ({
  profile,
  url,
  contactId,
  onDelete,
  deleting,
  searchOpen,
  onToggleSearch,
}: {
  profile: CounterpartyProfile | null;
  url: string | null;
  contactId: string;
  onDelete: () => void;
  deleting: boolean;
  searchOpen: boolean;
  onToggleSearch: () => void;
}) => (
  <header className="flex items-center gap-3 border-b border-border bg-card/30 px-4 py-3 sm:px-6">
    <Link
      to="/chats"
      className="md:hidden"
      aria-label="Back to threads"
    >
      <ArrowLeft className="size-5 text-muted-foreground" />
    </Link>
    <Avatar className="size-10">
      {url ? <AvatarImage src={url} alt="" /> : null}
      <AvatarFallback>{initials(profile?.fullName ?? "")}</AvatarFallback>
    </Avatar>
    <div className="min-w-0 flex-1">
      <Link
        to={`/u/${contactId}`}
        className="block truncate text-sm font-medium text-foreground hover:underline"
      >
        {profile?.fullName || (profile === null ? "(Deleted user)" : "Loading...")}
      </Link>
      {profile?.headline ? (
        <p className="truncate text-xs text-muted-foreground">
          {profile.headline}
        </p>
      ) : null}
    </div>
    <div className="flex items-center gap-1">
      <Button
        variant={searchOpen ? "secondary" : "ghost"}
        size="icon"
        aria-label={searchOpen ? "Close search" : "Search messages"}
        onClick={onToggleSearch}
      >
        <SearchIcon className="size-4" />
      </Button>
      {profile?.linkedinUrl ? (
        <Button asChild variant="ghost" size="icon" aria-label="Open LinkedIn">
          <a
            href={profile.linkedinUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            <Linkedin className="size-4" />
          </a>
        </Button>
      ) : null}
      <Button asChild variant="ghost" size="icon" aria-label="Open profile">
        <Link to={`/u/${contactId}`}>
          <ExternalLink className="size-4" />
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onSelect={() => {
              markThreadUnread(contactId);
              toast.success("Marked unread.");
            }}
          >
            <Mail className="mr-2 size-4" />
            Mark as unread
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onDelete}
            disabled={deleting}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Delete conversation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Report button sits outside the menu so it stays one click
          away. The reported user never learns who filed; admin
          handles the review queue. */}
      <ReportUserButton
        reportedUserId={contactId}
        reportedName={profile?.fullName}
      />
    </div>
  </header>
);

// ─── inbound (pending) banner ──────────────────────────────────────

const InboundBanner = ({
  name,
  onAccept,
  onDecline,
  busy,
}: {
  name: string;
  onAccept: () => void;
  onDecline: () => void;
  busy: "accept" | "decline" | "delete" | null;
}) => (
  <div className="flex flex-col gap-3 border-b border-gold/30 bg-gold/5 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
    <div className="flex-1">
      <p className="text-sm font-medium text-foreground">
        {name} wants to chat.
      </p>
      <p className="text-xs text-muted-foreground">
        Accept to unlock unlimited messaging. Decline to silence the thread.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onDecline}
        disabled={busy !== null}
      >
        <X className="mr-1 size-3.5" />
        Decline
      </Button>
      <Button
        variant="gold"
        size="sm"
        onClick={onAccept}
        disabled={busy !== null}
      >
        <Check className="mr-1 size-3.5" />
        Accept
      </Button>
    </div>
  </div>
);

// ─── messages ──────────────────────────────────────────────────────

const MessageList = ({
  messages,
  currentUserId,
}: {
  messages: ChatMessage[];
  currentUserId: string;
}) => {
  // Inject day-divider rows between messages crossing midnight.
  const items = useMemo(() => {
    const out: Array<
      | { kind: "day"; label: string; key: string }
      | { kind: "msg"; m: ChatMessage }
    > = [];
    let lastDay = "";
    for (const m of messages) {
      const k = dayKey(m.createdAt);
      if (k !== lastDay) {
        out.push({
          kind: "day",
          label: formatDayDivider(m.createdAt),
          key: `day-${k}`,
        });
        lastDay = k;
      }
      out.push({ kind: "msg", m });
    }
    return out;
  }, [messages]);

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((it) =>
        it.kind === "day" ? (
          <li key={it.key} className="my-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {it.label}
            </span>
            <div className="h-px flex-1 bg-border" />
          </li>
        ) : (
          <Bubble
            key={it.m.id}
            message={it.m}
            mine={it.m.senderId === currentUserId}
          />
        ),
      )}
    </ul>
  );
};

const Bubble = ({
  message,
  mine,
}: {
  message: ChatMessage;
  mine: boolean;
}) => (
  <li className={cn("flex w-full", mine ? "justify-end" : "justify-start")}>
    <div className={cn("max-w-[78%] sm:max-w-[60%]")}>
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          mine
            ? "rounded-br-sm bg-gold text-gold-foreground"
            : "rounded-bl-sm bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
      </div>
      <div
        className={cn(
          "mt-1 flex items-center gap-1 text-[10px] text-muted-foreground",
          mine ? "justify-end" : "justify-start",
        )}
      >
        <span>{formatTime(message.createdAt)}</span>
        {mine ? (
          message.readAt ? (
            <CheckCheck className="size-3 text-gold" aria-label="Read" />
          ) : message.deliveredAt ? (
            <CheckCheck className="size-3" aria-label="Delivered" />
          ) : (
            <Check className="size-3" aria-label="Sent" />
          )
        ) : null}
      </div>
    </div>
  </li>
);

// ─── declined ──────────────────────────────────────────────────────

const DeclinedFooter = ({
  onDelete,
  deleting,
}: {
  onDelete: () => void;
  deleting: boolean;
}) => (
  <footer className="flex flex-col gap-3 border-t border-border bg-card/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <div>
      <p className="text-sm font-medium text-foreground">
        You declined this conversation.
      </p>
      <p className="text-xs text-muted-foreground">
        New messages from this person are silenced. Delete the thread to
        remove it from your list.
      </p>
    </div>
    <Button
      variant="outline"
      size="sm"
      onClick={onDelete}
      disabled={deleting}
    >
      <Trash2 className="mr-1 size-3.5" />
      {deleting ? "Deleting..." : "Delete thread"}
    </Button>
  </footer>
);

// ─── composer ──────────────────────────────────────────────────────

const Composer = ({
  draft,
  onChange,
  onKeyDown,
  onSend,
  disabled,
  sending,
  state,
  pendingCount,
  pendingWindowStartAt,
  isInbound,
  isOutboundPending,
}: {
  draft: string;
  onChange: (s: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  disabled: boolean;
  sending: boolean;
  state: ThreadState;
  pendingCount: number;
  pendingWindowStartAt: string | null;
  isInbound: boolean;
  isOutboundPending: boolean;
}) => {
  const hint = useMemo(() => {
    if (isInbound) {
      return "Accept the request above to reply.";
    }
    if (isOutboundPending) {
      const remaining = Math.max(0, 2 - pendingCount);
      const base =
        remaining > 0
          ? `${remaining} of 2 messages remaining until they accept.`
          : "Limit reached. Wait for them to accept or for the 48-hour window to reset.";
      return pendingWindowStartAt
        ? `${base} Window opened ${new Date(pendingWindowStartAt).toLocaleString()}.`
        : base;
    }
    if (state === "accepted") return "Press Enter to send. Shift+Enter for a new line.";
    return "Send a message to start the conversation.";
  }, [isInbound, isOutboundPending, pendingCount, pendingWindowStartAt, state]);

  return (
    <footer className="border-t border-border bg-card/40 px-4 py-3 sm:px-6">
      <div className="flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={isInbound ? "Accept to reply" : "Write a message"}
          disabled={isInbound}
          rows={1}
          className="max-h-32 min-h-[44px] resize-none"
        />
        <Button
          variant="gold"
          onClick={onSend}
          disabled={disabled}
          aria-label="Send"
        >
          {sending ? "Sending" : "Send"}
          <Send className="ml-1 size-3.5" />
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{hint}</p>
    </footer>
  );
};
