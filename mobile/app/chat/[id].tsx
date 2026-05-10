/**
 * Chat detail screen — opened when the user taps "Request chat" or
 * "Apply" on a candidate's profile. Shows a normal messaging layout
 * (header → message list → composer) and, on first open via the CTA
 * (`?intro=1`), pops a dimmed/blurred intro modal explaining that
 * they're sending a DM along with their chat request.
 *
 * Messages persist via Supabase (chat_messages table, RLS-gated by
 * chat_contacts). Live updates come through a realtime subscription
 * on INSERTs to chat_messages where either side is the current user.
 *
 * Sending is gated by the recipient having accepted the chat request
 * (chat_contacts row exists). If they haven't, the RPC throws "not
 * contacts yet" and the UI surfaces a polite error.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CornerUpLeft,
  Copy as CopyIcon,
  MessageCircle,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react-native";
import {
  getAvatarUrl,
  getCandidatesByIds,
  listChatThread,
  markMessagesRead,
  sendChatMessage,
  requestOrSendChatMessage,
  acceptChatThread,
  declineChatThread,
  deleteChatThread,
  getChatThreadState,
  type ChatThreadState,
  type ChatMessage,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { Candidate } from "@/lib/types";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { MothEmptyState } from "@/components/MothEmptyState";
import { MothLoader } from "@/components/MothLoader";

// Status drives the WhatsApp-style ticks on outgoing bubbles:
//   sent      → 1 grey tick      (in DB, not delivered yet)
//   delivered → 2 grey ticks     (recipient device has it)
//   read      → 2 green ticks    (recipient saw the chat)
type MsgStatus = "sent" | "delivered" | "read";

// Group threshold — consecutive same-sender messages within this many
// ms get treated as one group. The tick only renders on the most
// recent message of each group, so a burst of 5 messages 26s apart
// shows a single tick at the bottom.
const GROUP_WINDOW_MS = 30_000;

type Msg = {
  id: string;
  text: string;
  fromMe: boolean;
  ts: number;
  status: MsgStatus;
};

const statusFromRow = (
  delivered: string | null,
  read: string | null,
): MsgStatus => {
  if (read) return "read";
  if (delivered) return "delivered";
  return "sent";
};

const toMsg = (m: ChatMessage, myId: string | undefined): Msg => ({
  id: m.id,
  text: m.body,
  fromMe: m.senderId === myId,
  ts: new Date(m.createdAt).getTime(),
  status: statusFromRow(m.deliveredAt, m.readAt),
});

// ─── Date / time helpers ───────────────────────────────────────────
const startOfDay = (ts: number): number => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const isSameDay = (a: number, b: number): boolean =>
  startOfDay(a) === startOfDay(b);

const dayKey = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

// Always renders the actual date, e.g. "May 9" or "May 5, 2025"
// (year shown only when it differs from the current year).
const formatDateLabel = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
};

// "2:47 PM" — 12-hour clock, locale-friendly.
const formatTimeOfDay = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

// ─── Email auto-underline ──────────────────────────────────────────
// Splits a string on email-shaped tokens. Each token is rendered with
// an underline so it looks like a tap target (we don't actually open
// the mail client — that's a future enhancement).
const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,})/g;

const renderTextWithEmails = (
  text: string,
  baseColor: string,
): React.ReactNode => {
  const parts = text.split(EMAIL_REGEX);
  return parts.map((part, i) => {
    if (!part) return null;
    const isEmail = EMAIL_REGEX.test(part);
    EMAIL_REGEX.lastIndex = 0; // reset stateful regex
    return (
      <Text
        key={i}
        style={
          isEmail
            ? { textDecorationLine: "underline", color: baseColor }
            : { color: baseColor }
        }
      >
        {part}
      </Text>
    );
  });
};

// ─── List items: messages + day-divider headers ────────────────────
type ListItem =
  | { kind: "msg"; key: string; msg: Msg; isLastInGroup: boolean }
  | { kind: "date"; key: string; label: string };

// Build the rendered list from the messages array (newest first).
// Walks through and injects a date header AFTER the last message of
// each day. With the FlatList inverted, that puts each header visually
// ABOVE the day's messages — the iMessage style.
//
// Also computes isLastInGroup per message: true when the next-newer
// neighbor is from a different sender or > GROUP_WINDOW_MS apart.
// That flag drives the bubble's tail and the time/tick footer.
const buildListItems = (messages: Msg[]): ListItem[] => {
  const items: ListItem[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const newer = i > 0 ? messages[i - 1] : undefined;
    const isLastInGroup =
      !newer ||
      newer.fromMe !== m.fromMe ||
      newer.ts - m.ts > GROUP_WINDOW_MS;
    items.push({
      kind: "msg",
      key: m.id,
      msg: m,
      isLastInGroup,
    });
    const older = messages[i + 1];
    if (!older || !isSameDay(m.ts, older.ts)) {
      items.push({
        kind: "date",
        key: `date-${dayKey(m.ts)}`,
        label: formatDateLabel(m.ts),
      });
    }
  }
  return items;
};

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, mode } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const params = useLocalSearchParams<{ id: string; intro?: string }>();
  const otherId = String(params.id);
  const isFake = otherId.startsWith("fake-");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  // Stage 4 chat-request state. While `state === 'outbound'` and
  // pending, the user can send up to 2 messages per 48-hour window.
  // While `state === 'inbound'`, the recipient sees an Accept button
  // and can't reply until they accept.
  const [threadState, setThreadState] = useState<ChatThreadState>({
    state: "none",
    acceptedAt: null,
    pendingCount: 0,
    pendingWindowStartAt: null,
  });
  const [accepting, setAccepting] = useState(false);
  // Intro modal — dimmed/blurred backdrop with "Send a DM" copy. Only
  // shown when navigated in via `?intro=1` (the CTA flow).
  const [showIntro, setShowIntro] = useState(params.intro === "1");
  // Long-press context menu (Reply / Copy / Delete) — null = closed.
  const [menuFor, setMenuFor] = useState<Msg | null>(null);
  // Reply target — when set, the composer shows a "Replying to…" pill
  // above it and the next sent message gets the quote prefixed.
  const [replyingTo, setReplyingTo] = useState<Msg | null>(null);
  // Locally hidden (Delete-for-me) message ids. Backend deletion is a
  // future enhancement; for now Delete just hides the bubble on this
  // device so testing feels right.
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const inputRef = useRef<TextInput>(null);

  // Load the other person's profile so the header can show their name
  // and avatar.
  useEffect(() => {
    if (!otherId) return;
    let cancelled = false;
    setLoading(true);
    // Fakes don't exist in Supabase — synthesize a placeholder so the
    // chat header still renders something useful during testing.
    if (isFake) {
      setCandidate({
        userId: otherId,
        fullName: "Test contact",
        linkedinUrl: "",
        headline: "",
        bio: "",
        skills: [],
        location: "",
        commitment: "",
        resumeName: null,
        resumePath: null,
        avatarPath: null,
      });
      setLoading(false);
      return;
    }
    getCandidatesByIds([otherId])
      .then((list) => {
        if (!cancelled) setCandidate(list[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setCandidate(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [otherId, isFake]);

  // Load the message thread + subscribe to realtime so new messages
  // and status updates (delivered/read) flow in live.
  useEffect(() => {
    if (!otherId || !user || isFake) return;
    let cancelled = false;
    // Pull the pending state alongside the messages so the UI knows
    // whether to show the Accept button vs the limit indicator.
    void getChatThreadState(otherId)
      .then((s) => {
        if (!cancelled) setThreadState(s);
      })
      .catch(() => {});
    listChatThread(otherId)
      .then((rows) => {
        if (cancelled) return;
        // FlatList is `inverted`, so newest first.
        setMessages(rows.map((m) => toMsg(m, user.id)).reverse());
        // We're looking at the chat — bulk-mark anything they sent us
        // as read (no-op if there's nothing unread).
        void markMessagesRead(otherId).catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });

    // Realtime: subscribe to BOTH INSERT (new messages) and UPDATE
    // (delivered_at / read_at flips). Postgres-changes filters only
    // support eq/neq/in/lt/gt, so we can't filter the pair server-side
    // cheaply; we filter client-side.
    const channel = supabase
      .channel(`chat:${user.id}:${otherId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const r = payload.new as {
            id: string;
            sender_id: string;
            recipient_id: string;
            body: string;
            created_at: string;
            delivered_at: string | null;
            read_at: string | null;
          };
          const involvesPair =
            (r.sender_id === user.id && r.recipient_id === otherId) ||
            (r.sender_id === otherId && r.recipient_id === user.id);
          if (!involvesPair) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === r.id)) return prev;
            const next: Msg = {
              id: r.id,
              text: r.body,
              fromMe: r.sender_id === user.id,
              ts: new Date(r.created_at).getTime(),
              status: statusFromRow(r.delivered_at, r.read_at),
            };
            return [next, ...prev];
          });
          // If the inbound message was from the other person and we're
          // looking at the chat right now, mark it read immediately so
          // they see the green double-check.
          if (r.sender_id === otherId) {
            void markMessagesRead(otherId).catch(() => {});
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const r = payload.new as {
            id: string;
            sender_id: string;
            recipient_id: string;
            delivered_at: string | null;
            read_at: string | null;
          };
          const involvesPair =
            (r.sender_id === user.id && r.recipient_id === otherId) ||
            (r.sender_id === otherId && r.recipient_id === user.id);
          if (!involvesPair) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === r.id
                ? { ...m, status: statusFromRow(r.delivered_at, r.read_at) }
                : m,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [otherId, user, isFake]);

  const send = async () => {
    const rawText = draft.trim();
    if (!rawText || sending) return;
    // If replying, prepend a quote line so the recipient sees the
    // context. Plain-text format keeps it backend-agnostic.
    const text = replyingTo
      ? `> ${replyingTo.text.split("\n").join(" ")}\n${rawText}`
      : rawText;
    // Fakes: stay in local-only mode so the user can still play with
    // the UI without the RPC blowing up on a non-existent recipient.
    if (isFake) {
      setMessages((prev) => [
        {
          id: String(Date.now()),
          text,
          fromMe: true,
          ts: Date.now(),
          status: "sent",
        },
        ...prev,
      ]);
      setDraft("");
      setReplyingTo(null);
      return;
    }
    setSending(true);
    try {
      // Inbound thread (they messaged me first): I haven't tapped
      // Accept yet, so my message would go into the void. Block
      // sending and prompt to accept first.
      if (threadState.state === "inbound") {
        setSending(false);
        Alert.alert(
          "Accept first",
          "Tap Accept above to reply. Once you accept, you can both chat freely.",
        );
        return;
      }
      // Declined thread: nothing goes through, full stop.
      if (threadState.state === "declined") {
        setSending(false);
        Alert.alert(
          "This chat was declined",
          "Delete the thread to clear it from your list.",
        );
        return;
      }

      // Stage 4 unified path. The RPC creates the pending row on the
      // first message, increments the per-window counter, and only
      // throws "limit_reached" once the requester has used all 2
      // messages within a 48-hour window.
      const res = await requestOrSendChatMessage(otherId, text);
      setDraft("");
      setReplyingTo(null);
      // Refresh state so the indicator updates (count goes up,
      // window may roll over).
      void getChatThreadState(otherId)
        .then(setThreadState)
        .catch(() => {});
      // Realtime will deliver the inserted row and prepend it.
      void res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send.";
      if (msg.includes("limit_reached")) {
        const start = threadState.pendingWindowStartAt
          ? new Date(threadState.pendingWindowStartAt).getTime()
          : Date.now();
        const next = new Date(start + 48 * 3600 * 1000);
        Alert.alert(
          "You've sent 2 messages",
          `You can send 2 more after they accept, or after ${next.toLocaleString()}.`,
        );
      } else {
        Alert.alert("Couldn't send", msg);
      }
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptChatThread(otherId);
      // Refresh state so the Accept banner disappears and the input
      // unlocks.
      const next = await getChatThreadState(otherId);
      setThreadState(next);
    } catch (err) {
      Alert.alert(
        "Couldn't accept",
        err instanceof Error ? err.message : "Try again.",
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      "Decline chat?",
      "They won't be able to send any more messages. You can delete the thread after.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              await declineChatThread(otherId);
              const next = await getChatThreadState(otherId);
              setThreadState(next);
            } catch (err) {
              Alert.alert(
                "Couldn't decline",
                err instanceof Error ? err.message : "Try again.",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteThread = () => {
    Alert.alert(
      "Delete this chat?",
      "It disappears from your threads. They keep their copy until they delete too.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteChatThread(otherId);
              router.back();
            } catch (err) {
              Alert.alert(
                "Couldn't delete",
                err instanceof Error ? err.message : "Try again.",
              );
            }
          },
        },
      ],
    );
  };

  // Long-press menu handlers --------------------------------------
  const closeMenu = () => setMenuFor(null);

  const handleReply = (m: Msg) => {
    setReplyingTo(m);
    closeMenu();
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCopy = async (m: Msg) => {
    closeMenu();
    try {
      // expo-clipboard isn't a hard dep — fall back gracefully if the
      // user hasn't installed it yet (`npx expo install expo-clipboard`).
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Clipboard = require("expo-clipboard");
      await Clipboard.setStringAsync(m.text);
    } catch {
      Alert.alert(
        "Couldn't copy",
        "Run `npx expo install expo-clipboard` to enable Copy.",
      );
    }
  };

  const handleDelete = (m: Msg) => {
    closeMenu();
    setHidden((prev) => {
      const next = new Set(prev);
      next.add(m.id);
      return next;
    });
  };

  // Filter out locally-deleted messages, then build the FlatList
  // payload (messages + day-divider headers + per-bubble grouping
  // metadata). Memoized so it doesn't recompute on every keystroke.
  const listItems = useMemo<ListItem[]>(
    () => buildListItems(messages.filter((m) => !hidden.has(m.id))),
    [messages, hidden],
  );

  const dismissIntro = () => {
    setShowIntro(false);
    // Hand focus to the composer so the user can immediately type.
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const url =
    candidate?.avatarPath?.startsWith("http")
      ? candidate.avatarPath
      : getAvatarUrl(candidate?.avatarPath ?? null);
  const name = candidate?.fullName || "Loading…";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header — back arrow + person summary */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        {url ? (
          <Image source={{ uri: url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <User size={20} color={theme.textDim} strokeWidth={1.5} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {candidate?.headline ? (
            <Text style={styles.headline} numberOfLines={1}>
              {candidate.headline}
            </Text>
          ) : null}
        </View>
        {/* Stage 4: prominent Accept pill on the contact name when
            this is an inbound chat request. Tapping promotes both
            sides into mutual contacts. */}
        {threadState.state === "inbound" && (
          <Pressable
            onPress={handleAccept}
            disabled={accepting}
            style={({ pressed }) => [
              styles.acceptHeaderBtn,
              pressed && { opacity: 0.85 },
              accepting && { opacity: 0.5 },
            ]}
          >
            {accepting ? (
              <ActivityIndicator color={theme.textOnPrimary} size="small" />
            ) : (
              <>
                <Check size={14} color={theme.textOnPrimary} strokeWidth={3} />
                <Text style={styles.acceptHeaderText}>Accept</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Big in-chat Accept banner when this is an inbound request.
          Same action as the header button - just impossible to miss. */}
      {threadState.state === "inbound" && (
        <View style={styles.acceptBanner}>
          <Text style={styles.acceptBannerTitle}>
            {name || "They"} sent you a chat request
          </Text>
          <Text style={styles.acceptBannerBody}>
            Read their messages below. Tap Accept to reply.
          </Text>
          <View style={styles.acceptDeclineRow}>
            <Pressable
              onPress={handleDecline}
              style={({ pressed }) => [
                styles.declineBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <X size={18} color={theme.destructive} strokeWidth={2.5} />
              <Text style={styles.declineBtnText}>Decline</Text>
            </Pressable>
            <Pressable
              onPress={handleAccept}
              disabled={accepting}
              style={({ pressed }) => [
                styles.acceptBigBtn,
                { flex: 1.4 },
                pressed && { opacity: 0.85 },
                accepting && { opacity: 0.5 },
              ]}
            >
              {accepting ? (
                <ActivityIndicator color={theme.textOnPrimary} />
              ) : (
                <>
                  <Check size={18} color={theme.textOnPrimary} strokeWidth={3} />
                  <Text style={styles.acceptBigText}>Accept chat</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      )}

      {/* Declined: a frosted overlay sits over the chat content with
          a clear "this chat was declined" panel + a Delete button so
          either side can wipe it from their list. */}
      {threadState.state === "declined" && (
        <View style={styles.declinedBanner}>
          <X size={20} color={theme.destructive} strokeWidth={2.5} />
          <Text style={styles.declinedTitle}>This chat was declined</Text>
          <Text style={styles.declinedBody}>
            No more messages will go through. You can delete the thread to
            clear it from your list.
          </Text>
          <Pressable
            onPress={handleDeleteThread}
            style={({ pressed }) => [
              styles.declinedDeleteBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.declinedDeleteText}>Delete chat</Text>
          </Pressable>
        </View>
      )}

      {/* Outbound pending: small status row showing how many messages
          the user has sent in the current 48-hour window. Helps them
          calibrate their pitch instead of getting blocked by surprise. */}
      {threadState.state === "outbound" && threadState.pendingCount > 0 && (
        <View style={styles.limitStrip}>
          <Text style={styles.limitText}>
            {threadState.pendingCount}/2 messages sent · waiting on accept
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={[
          { flex: 1 },
          // Decline blurs the chat: messages and composer fade so
          // the active surface is the declined banner above.
          threadState.state === "declined" && { opacity: 0.35 },
        ]}
        pointerEvents={threadState.state === "declined" ? "none" : "auto"}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.center}>
            <MothLoader size={140} />
          </View>
        ) : messages.length === 0 ? (
          <MothEmptyState
            variant="threads"
            title="No messages yet."
            sub="Quiet wings. Say hi to get the thread started."
          />
        ) : (
          <FlatList
            data={listItems}
            keyExtractor={(it) => it.key}
            inverted
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              if (item.kind === "date") {
                return (
                  <View style={styles.dayDivider}>
                    <Text style={styles.dayDividerText}>{item.label}</Text>
                  </View>
                );
              }
              const m = item.msg;
              const last = item.isLastInGroup;
              const baseColor = m.fromMe ? theme.textOnPrimary : theme.text;
              return (
                <View
                  style={[
                    styles.bubbleRow,
                    m.fromMe ? styles.rowMe : styles.rowThem,
                    // Tight when stacked in same group, breathing room
                    // between groups.
                    last ? styles.rowGroupEnd : styles.rowStacked,
                  ]}
                >
                  <Pressable
                    onLongPress={() => setMenuFor(m)}
                    delayLongPress={350}
                    style={({ pressed }) => [
                      styles.bubble,
                      m.fromMe ? styles.bubbleMe : styles.bubbleThem,
                      // Tail only on the most recent bubble of each
                      // group; stacked bubbles get fully rounded
                      // corners (iMessage / WhatsApp style).
                      last &&
                        (m.fromMe ? styles.tailMe : styles.tailThem),
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={styles.bubbleText} selectable>
                      {renderTextWithEmails(m.text, baseColor)}
                    </Text>
                  </Pressable>
                  {last ? (
                    <View
                      style={[
                        styles.footer,
                        m.fromMe ? styles.footerMe : styles.footerThem,
                      ]}
                    >
                      <Text style={styles.footerTime}>
                        {formatTimeOfDay(m.ts)}
                      </Text>
                      {m.fromMe ? (
                        m.status === "sent" ? (
                          <Check
                            size={14}
                            color={theme.textDim}
                            strokeWidth={2.8}
                          />
                        ) : (
                          <CheckCheck
                            size={14}
                            color={
                              m.status === "read" ? "#34D399" : theme.textDim
                            }
                            strokeWidth={2.8}
                          />
                        )
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            }}
          />
        )}

        {/* Reply preview — appears above the composer when the user
            picked Reply from the long-press menu. Shows a one-line
            preview of the original message; the X clears the reply. */}
        {replyingTo ? (
          <View style={styles.replyBar}>
            <View style={styles.replyAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.replyLabel}>Replying to</Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {replyingTo.text}
              </Text>
            </View>
            <Pressable
              onPress={() => setReplyingTo(null)}
              hitSlop={10}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <X size={16} color={theme.textMuted} />
            </Pressable>
          </View>
        ) : null}

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            placeholder="Send a message…"
            placeholderTextColor={theme.textDim}
            style={styles.input}
            multiline
            editable={!showIntro}
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim() || sending}
            style={({ pressed }) => [
              styles.sendBtn,
              (!draft.trim() || sending) && { opacity: 0.4 },
              pressed && { backgroundColor: theme.goldDeep },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={theme.textOnPrimary} />
            ) : (
              <Send size={16} color={theme.textOnPrimary} strokeWidth={2.2} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Long-press context menu — shows Reply / Copy / (Delete if
          the message is mine). Tapping the backdrop dismisses. */}
      <Modal
        visible={menuFor !== null}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuBackdrop} onPress={closeMenu}>
          <View style={styles.menuCard}>
            <Pressable
              onPress={() => menuFor && handleReply(menuFor)}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: theme.bgAlt },
              ]}
            >
              <CornerUpLeft size={16} color={theme.text} strokeWidth={2} />
              <Text style={styles.menuItemText}>Reply</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              onPress={() => menuFor && handleCopy(menuFor)}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: theme.bgAlt },
              ]}
            >
              <CopyIcon size={16} color={theme.text} strokeWidth={2} />
              <Text style={styles.menuItemText}>Copy</Text>
            </Pressable>
            {menuFor?.fromMe ? (
              <>
                <View style={styles.menuDivider} />
                <Pressable
                  onPress={() => handleDelete(menuFor)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && { backgroundColor: theme.bgAlt },
                  ]}
                >
                  <Trash2
                    size={16}
                    color={theme.destructive}
                    strokeWidth={2}
                  />
                  <Text
                    style={[styles.menuItemText, { color: theme.destructive }]}
                  >
                    Delete
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>

      {/* Intro modal — dimmed + blurred backdrop with chat icon, copy,
          and an OK button. Shown only when navigated in via the CTA. */}
      {showIntro && (
        <View
          style={StyleSheet.absoluteFill}
          pointerEvents="auto"
        >
          <BlurView
            intensity={mode === "dark" ? 50 : 40}
            tint={mode === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.45)" },
            ]}
          />
          <View style={styles.introCenter}>
            <View style={styles.introCard}>
              <View style={styles.introIconWrap}>
                <MessageCircle
                  size={36}
                  color={theme.gold}
                  strokeWidth={2}
                />
              </View>
              <Text style={styles.introTitle}>Send a DM</Text>
              <Text style={styles.introBody}>
                Send them a text that they can see along with your request.
              </Text>
              <Pressable
                onPress={dismissIntro}
                style={({ pressed }) => [
                  styles.introBtn,
                  pressed && { backgroundColor: theme.goldDeep },
                ]}
              >
                <Text style={styles.introBtnText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.goldSoft,
    },
    avatarFallback: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bgAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    name: {
      color: theme.text,
      fontFamily: fonts.display,
      fontSize: 16,
      letterSpacing: -0.2,
    },
    headline: {
      color: theme.textMuted,
      fontSize: 11,
      marginTop: 1,
    },

    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    emptyText: {
      color: theme.textDim,
      fontFamily: fonts.mono,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },

    list: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 12,
    },
    // Wraps each bubble + its optional time/tick footer. Spacing
    // between rows: tight when stacked in a group, loose between
    // groups.
    bubbleRow: {
      maxWidth: "82%",
    },
    rowMe: {
      alignSelf: "flex-end",
      alignItems: "flex-end",
    },
    rowThem: {
      alignSelf: "flex-start",
      alignItems: "flex-start",
    },
    rowStacked: {
      marginTop: 2,
    },
    // Spacing between separate groups (after the bubble with the
    // tail). Kept small so consecutive groups still read as one
    // continuous conversation.
    rowGroupEnd: {
      marginTop: 4,
    },
    bubble: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
    },
    bubbleMe: {
      backgroundColor: theme.gold,
    },
    bubbleThem: {
      backgroundColor: theme.bubble,
      borderWidth: 1,
      borderColor: theme.border,
    },
    // The corner that anchors the speech-bubble tail — only applied
    // to the most recent bubble of each group.
    tailMe: {
      borderBottomRightRadius: 4,
    },
    tailThem: {
      borderBottomLeftRadius: 4,
    },
    bubbleText: {
      fontSize: 15.5,
      lineHeight: 21,
    },
    // Time + tick row that sits below the last bubble of each group.
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 3,
      paddingHorizontal: 4,
    },
    footerMe: {
      alignSelf: "flex-end",
    },
    footerThem: {
      alignSelf: "flex-start",
    },
    footerTime: {
      color: theme.textDim,
      fontSize: 11,
      fontFamily: fonts.mono,
      letterSpacing: 0.4,
    },
    // Day divider with the absolute date (e.g., "May 9"), shown at
    // the start of each new day's messages.
    dayDivider: {
      alignSelf: "center",
      paddingVertical: 16,
    },
    dayDividerText: {
      color: theme.textMuted,
      fontFamily: fonts.mono,
      fontSize: 11,
      letterSpacing: 1.6,
      textTransform: "uppercase",
    },

    // Reply preview that sits above the composer when the user picked
    // Reply on a message. Vertical gold accent bar + label + preview.
    replyBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.bgElev,
    },
    replyAccent: {
      width: 3,
      alignSelf: "stretch",
      backgroundColor: theme.gold,
      borderRadius: 2,
    },
    replyLabel: {
      color: theme.gold,
      fontFamily: fonts.mono,
      fontSize: 10,
      letterSpacing: 1.4,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    replyText: {
      color: theme.textMuted,
      fontSize: 13,
    },
    // Stage 4 chat-request pieces
    acceptHeaderBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: theme.gold,
    },
    acceptHeaderText: {
      color: theme.textOnPrimary,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    acceptBanner: {
      paddingHorizontal: 18,
      paddingVertical: 16,
      gap: 8,
      backgroundColor: theme.goldGlow,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderTopColor: theme.goldSoft,
      borderBottomColor: theme.goldSoft,
    },
    acceptBannerTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    acceptBannerBody: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
    },
    acceptBigBtn: {
      marginTop: 4,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 50,
      borderRadius: 12,
      backgroundColor: theme.gold,
    },
    acceptBigText: {
      color: theme.textOnPrimary,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    acceptDeclineRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 4,
    },
    declineBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 50,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: `${theme.destructive}66`,
      backgroundColor: `${theme.destructive}10`,
    },
    declineBtnText: {
      color: theme.destructive,
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    declinedBanner: {
      paddingHorizontal: 22,
      paddingVertical: 22,
      gap: 8,
      backgroundColor: `${theme.destructive}10`,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderTopColor: `${theme.destructive}40`,
      borderBottomColor: `${theme.destructive}40`,
      alignItems: "center",
    },
    declinedTitle: {
      color: theme.destructive,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: -0.2,
      marginTop: 4,
    },
    declinedBody: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
    },
    declinedDeleteBtn: {
      marginTop: 6,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 999,
      backgroundColor: theme.destructive,
    },
    declinedDeleteText: {
      color: "#FFFFFF",
      fontSize: 13.5,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    limitStrip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.bgAlt,
    },
    limitText: {
      color: theme.textMuted,
      fontSize: 11.5,
      fontFamily: fonts.mono,
      letterSpacing: 0.6,
      textAlign: "center",
    },
    composer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      padding: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.bg,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      minHeight: 42,
      backgroundColor: theme.bgElev,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingTop: 11,
      paddingBottom: 11,
      color: theme.text,
      fontSize: 14,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.gold,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.gold,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },

    introCenter: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
    },
    introCard: {
      width: "100%",
      maxWidth: 340,
      backgroundColor: theme.bgElev,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 18,
      alignItems: "center",
      shadowColor: "#000000",
      shadowOpacity: 0.4,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 14 },
      elevation: 18,
    },
    introIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.goldGlow,
      borderWidth: 1,
      borderColor: theme.goldSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    introTitle: {
      color: theme.text,
      fontFamily: fonts.display,
      fontSize: 22,
      letterSpacing: -0.3,
      marginBottom: 6,
    },
    introBody: {
      color: theme.textMuted,
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
      marginBottom: 18,
    },
    introBtn: {
      width: "100%",
      height: 46,
      borderRadius: 13,
      backgroundColor: theme.gold,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.gold,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
      elevation: 4,
    },
    introBtnText: {
      color: theme.textOnPrimary,
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    // Long-press menu — centered card with Reply / Copy / (Delete).
    menuBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    menuCard: {
      width: "100%",
      maxWidth: 260,
      backgroundColor: theme.bgElev,
      borderRadius: 14,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOpacity: 0.4,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 14,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    menuItemText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "500",
    },
    menuDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginHorizontal: 8,
    },
  });
