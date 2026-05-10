/**
 * Thread sidebar for the /chats page. Renders one row per known
 * counterparty: avatar, name, last-message preview, time, plus a
 * pending / declined badge for unaccepted threads. Clicking a row
 * navigates to /chats/:contactId.
 *
 * The list is filterable by name via the small search input at the
 * top — handy once a user has more than ~10 threads.
 */
import { useMemo, useState } from "react";
import { Search, Inbox } from "lucide-react";

import type { ChatThreadSummary } from "@/lib/mynet-storage";
import type { Candidate } from "@/lib/mynet-types";
import { getAvatarUrl } from "@/lib/mynet-storage";
import {
  clearThreadUnread,
  useThreadUnreadFlags,
} from "@/lib/threadUnread";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatRelative } from "./ChatTime";

const initials = (name: string): string => {
  if (!name.trim()) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};

export type ThreadListItem = ChatThreadSummary & {
  fullName: string;
  avatarPath: string | null;
};

type Props = {
  items: ThreadListItem[];
  selectedId: string | null;
  currentUserId: string | null;
  loading: boolean;
  onSelect: (contactId: string) => void;
};

export const ChatThreadList = ({
  items,
  selectedId,
  currentUserId,
  loading,
  onSelect,
}: Props) => {
  const [query, setQuery] = useState("");
  // Read the unread-flag set so any change in another component
  // (e.g. user marks a thread unread from the chat header) repaints
  // this list. The hook returns a Set; we look up by contactId.
  const unreadFlags = useThreadUnreadFlags();
  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return items;
    return items.filter(
      (it) =>
        it.fullName.toLowerCase().includes(q) ||
        it.lastBody.toLowerCase().includes(q),
    );
  }, [items, q]);

  return (
    <aside className="flex h-full min-h-0 flex-col md:border-r md:border-border md:bg-card/30">
      {/* Mobile mirrors the native app header: gold-eyebrow pill +
          big display title. Desktop keeps the compact tile header
          to fit the two-column split layout. */}
      <div className="md:hidden px-5 pt-5 pb-2">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-sm border border-gold-soft bg-gold/5 px-2.5 py-1">
          <Inbox className="size-3 text-gold" aria-hidden />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gold">
            Threads
          </span>
        </div>
        <h1 className="font-display text-3xl text-foreground">
          Conversations.
        </h1>
      </div>
      <div className="hidden md:flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-display text-base text-foreground">
          Conversations
        </h2>
        <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {items.length}
        </span>
      </div>
      {/* Search input — desktop only. The native app has no
          per-thread search in the list, so mobile drops it too. */}
      <div className="hidden md:block border-b border-border px-3 py-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 text-xs text-muted-foreground">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-muted-foreground">
          No matches.
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <ul className="py-1">
            {filtered.map((it) => (
              <ThreadRow
                key={it.contactId}
                item={it}
                active={it.contactId === selectedId}
                currentUserId={currentUserId}
                markedUnread={unreadFlags.has(it.contactId)}
                onSelect={() => {
                  // Clearing the unread flag on open matches the
                  // user's mental model: "I'm reading it now, so it's
                  // not unread anymore." If they want it back, they
                  // hit Mark as unread in the chat header dropdown.
                  clearThreadUnread(it.contactId);
                  onSelect(it.contactId);
                }}
              />
            ))}
          </ul>
        </ScrollArea>
      )}
    </aside>
  );
};

const ThreadRow = ({
  item,
  active,
  currentUserId,
  markedUnread,
  onSelect,
}: {
  item: ThreadListItem;
  active: boolean;
  currentUserId: string | null;
  markedUnread: boolean;
  onSelect: () => void;
}) => {
  const url = getAvatarUrl(item.avatarPath);
  const isFromMe = !!item.lastSender && item.lastSender === currentUserId;
  const preview = item.lastBody
    ? `${isFromMe ? "You: " : ""}${item.lastBody}`
    : "No messages yet.";

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors",
          "hover:bg-accent/50",
          active && "bg-accent text-accent-foreground",
        )}
      >
        <div className="relative shrink-0">
          <Avatar className="size-10">
            {url ? <AvatarImage src={url} alt="" /> : null}
            <AvatarFallback className="text-xs">
              {initials(item.fullName)}
            </AvatarFallback>
          </Avatar>
          {markedUnread ? (
            <span
              aria-label="Marked unread"
              className="absolute -top-0.5 -right-0.5 block size-2.5 rounded-full bg-gold ring-2 ring-card"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm",
                markedUnread
                  ? "font-semibold text-foreground"
                  : "font-medium text-foreground",
              )}
            >
              {item.fullName || "Unnamed"}
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatRelative(item.lastAt)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className={cn(
                "truncate text-xs",
                markedUnread
                  ? "text-foreground/80 font-medium"
                  : "text-muted-foreground",
              )}
            >
              {preview}
            </span>
            <StateBadge state={item.state} fromMe={isFromMe} />
          </div>
        </div>
      </button>
    </li>
  );
};

const StateBadge = ({
  state,
  fromMe,
}: {
  state: ChatThreadSummary["state"];
  fromMe: boolean;
}) => {
  if (state === "accepted" || state === "none") return null;
  if (state === "declined") {
    return (
      <span className="ml-auto shrink-0 rounded-sm border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em] text-destructive">
        Declined
      </span>
    );
  }
  // outbound = waiting on them; inbound = action needed from me
  const label = state === "inbound" ? "Pending" : fromMe ? "Sent" : "Pending";
  const tone =
    state === "inbound"
      ? "border-gold/40 bg-gold/10 text-gold"
      : "border-border bg-muted/40 text-muted-foreground";
  return (
    <span
      className={cn(
        "ml-auto shrink-0 rounded-sm border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.14em]",
        tone,
      )}
    >
      {label}
    </span>
  );
};

const EmptyState = () => (
  <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
    <Inbox className="size-5 text-muted-foreground" aria-hidden />
    <p className="text-sm font-medium text-foreground">No conversations</p>
    <p className="text-xs text-muted-foreground">
      Send a message to a founder or operator from Match or Talent. The
      thread will land here.
    </p>
  </div>
);

// Helper for the page to merge thread metadata with profile data
// pulled from getCandidatesByIds.
export const mergeThreadProfiles = (
  threads: ChatThreadSummary[],
  profiles: Candidate[],
): ThreadListItem[] => {
  const byId = new Map(profiles.map((p) => [p.userId, p]));
  return threads.map((t) => {
    const p = byId.get(t.contactId);
    return {
      ...t,
      fullName: p?.fullName ?? "",
      avatarPath: p?.avatarPath ?? null,
    };
  });
};
