/**
 * Threads tab. After Stage 4, this is the single inbox: every chat
 * thread (pending or accepted) shows up as a row, sorted by most
 * recent activity. The old notifications-driven view is gone -
 * list_chat_threads (migration 0019) returns everything we need.
 *
 * Each row's `state`:
 * - "accepted" - normal mutual chat
 * - "inbound" - they sent me a chat request, I haven't accepted.
 * Inline Accept button on the row.
 * - "outbound" - I sent the request, waiting on them. Pending pill.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
 ActivityIndicator,
 Alert,
 FlatList,
 Image,
 Pressable,
 StyleSheet,
 Text,
 View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Inbox, MessageCircle, Trash2, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import {
 acceptChatThread,
 declineChatThread,
 deleteChatThread,
 getAvatarUrl,
 getCandidatesByIds,
 listChatThreads,
 type ChatThreadSummary,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { clearUnread } from "@/lib/unread";
import {
 clearThreadUnread,
 markThreadUnread,
 useThreadUnreadFlags,
} from "@/lib/threadUnread";
import type { Candidate } from "@/lib/types";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { confirm } from "@/lib/confirm";
import { MothEmptyState } from "@/components/MothEmptyState";
import { MothLoader } from "@/components/MothLoader";

const formatRelative = (iso: string | null): string => {
 if (!iso) return "";
 const d = new Date(iso).getTime();
 const diffSec = Math.max(0, Math.floor((Date.now() - d) / 1000));
 if (diffSec < 60) return "now";
 const m = Math.floor(diffSec / 60);
 if (m < 60) return `${m}m`;
 const h = Math.floor(m / 60);
 if (h < 24) return `${h}h`;
 const day = Math.floor(h / 24);
 if (day < 7) return `${day}d`;
 return new Date(iso).toLocaleDateString();
};

type Row = ChatThreadSummary & { contact?: Candidate };

export default function ThreadsScreen() {
 const router = useRouter();
 const { theme } = useTheme();
 const styles = useMemo(() => makeStyles(theme), [theme]);
 const { user } = useAuth();
 const [rows, setRows] = useState<Row[]>([]);
 const [loading, setLoading] = useState(true);
 const [acceptingId, setAcceptingId] = useState<string | null>(null);
 // Marked-unread set, kept in sync with the local store via pub/sub.
 // Repaints the list whenever the user marks/clears from the chat
 // header on this device or another.
 const unreadFlags = useThreadUnreadFlags();

 const refresh = useCallback(async () => {
 if (!user) return;
 setLoading(true);
 try {
 const threads = await listChatThreads();
 const ids = threads.map((t) => t.contactId);
 const contacts =
 ids.length > 0 ? await getCandidatesByIds(ids).catch(() => []) : [];
 const byId = new Map(contacts.map((c) => [c.userId, c]));
 setRows(
 threads.map((t) => ({
 ...t,
 contact: byId.get(t.contactId),
 })),
 );
 } catch {
 setRows([]);
 } finally {
 setLoading(false);
 }
 }, [user]);

 // Refetch on first mount and on every tab focus so accepts on the
 // chat detail screen propagate back here without a manual reload.
 useEffect(() => {
 void refresh();
 }, [refresh]);
 useFocusEffect(
 useCallback(() => {
 // Clear the unread badge as soon as the user lands on Threads.
 clearUnread("threads");
 void refresh();
 }, [refresh]),
 );

 const handleDelete = (otherId: string) => {
 void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
 setRows((prev) => prev.filter((r) => r.contactId !== otherId));
 void deleteChatThread(otherId).catch(() => void refresh());
 };

 // Long-press a row to toggle the "marked unread" flag. Mirrors the
 // web's chat-header dropdown action; keeps both clients consistent
 // for users who jump between phone and laptop.
 const handleLongPress = (otherId: string) => {
 void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
 const isMarked = unreadFlags.has(otherId);
 confirm({
 title: isMarked ? "Clear unread?" : "Mark as unread?",
 message: isMarked
 ? "Removes the dot from this thread."
 : "Adds a dot you'll see until you open it again.",
 confirmLabel: isMarked ? "Clear" : "Mark unread",
 onConfirm: () =>
 isMarked ? clearThreadUnread(otherId) : markThreadUnread(otherId),
 });
 };

 const handleAccept = async (otherId: string) => {
 if (acceptingId) return;
 setAcceptingId(otherId);
 void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
 try {
 await acceptChatThread(otherId);
 // Optimistic: flip this row to accepted locally.
 setRows((prev) =>
 prev.map((r) =>
 r.contactId === otherId
 ? { ...r, state: "accepted", acceptedAt: new Date().toISOString() }
 : r,
 ),
 );
 } catch (err) {
 Alert.alert(
 "Couldn't accept",
 err instanceof Error ? err.message : "Try again.",
 );
 } finally {
 setAcceptingId(null);
 }
 };

 return (
 <SafeAreaView style={styles.safe} edges={["top"]}>
 <View style={styles.header}>
 <View style={styles.eyebrow}>
 <MessageCircle size={12} color={theme.gold} />
 <Text style={styles.eyebrowText}>Threads</Text>
 </View>
 <Text style={styles.h1}>Conversations.</Text>
 </View>

 {loading ? (
 <View style={styles.center}>
 <MothLoader size={160} />
 </View>
 ) : rows.length === 0 ? (
 <MothEmptyState
 variant="threads"
 title="No threads yet."
 sub="Open a chat with a founder or partner from Match or Search. Their first message lands here."
 />
 ) : (
 <FlatList
 data={rows}
 keyExtractor={(r) => r.contactId}
 ItemSeparatorComponent={() => (
 <View style={{ height: 1, backgroundColor: theme.border }} />
 )}
 renderItem={({ item }) => (
 <ThreadRow
 row={item}
 accepting={acceptingId === item.contactId}
 markedUnread={unreadFlags.has(item.contactId)}
 onPress={() => {
 // Tapping the row clears the flag — same UX as web:
 // "I'm reading it now, so it's not unread anymore."
 clearThreadUnread(item.contactId);
 router.push(`/chat/${item.contactId}` as never);
 }}
 onLongPress={() => handleLongPress(item.contactId)}
 onAccept={() => handleAccept(item.contactId)}
 onDelete={() => handleDelete(item.contactId)}
 styles={styles}
 theme={theme}
 />
 )}
 />
 )}
 </SafeAreaView>
 );
}

const ThreadRow = ({
 row,
 accepting,
 markedUnread,
 onPress,
 onLongPress,
 onAccept,
 onDelete,
 styles,
 theme,
}: {
 row: Row;
 accepting: boolean;
 markedUnread: boolean;
 onPress: () => void;
 onLongPress: () => void;
 onAccept: () => void;
 onDelete: () => void;
 styles: ReturnType<typeof makeStyles>;
 theme: ThemePalette;
}) => {
 const c = row.contact;
 const url = c?.avatarPath?.startsWith("http")
 ? c.avatarPath
 : getAvatarUrl(c?.avatarPath ?? null);
 const display = c?.fullName || "Unknown";
 const sub = c?.headline || "";
 const isInbound = row.state === "inbound";
 const isOutbound = row.state === "outbound";
 const isDeclined = row.state === "declined";

 return (
 <Pressable
 onPress={onPress}
 onLongPress={onLongPress}
 delayLongPress={350}
 style={({ pressed }) => [
 styles.row,
 pressed && { backgroundColor: theme.bgElev },
 ]}
 >
 <View>
 {url ? (
 <Image source={{ uri: url }} style={styles.avatar} />
 ) : (
 <View style={styles.avatarFallback}>
 <Text style={styles.avatarInitials}>
 {(display[0] ?? "?").toUpperCase()}
 </Text>
 </View>
 )}
 {markedUnread ? <View style={styles.unreadDot} /> : null}
 </View>
 <View style={{ flex: 1, minWidth: 0 }}>
 <View style={styles.rowHead}>
 <Text
 style={[
 styles.name,
 markedUnread && { fontWeight: "700" },
 ]}
 numberOfLines={1}
 >
 {display}
 </Text>
 {row.lastAt ? (
 <Text style={styles.time}>{formatRelative(row.lastAt)}</Text>
 ) : null}
 </View>
 <View style={styles.metaRow}>
 {isInbound && (
 <View
 style={[
 styles.statePill,
 {
 backgroundColor: theme.goldGlow,
 borderColor: theme.goldSoft,
 },
 ]}
 >
 <Text style={[styles.statePillText, { color: theme.gold }]}>
 Wants to chat
 </Text>
 </View>
 )}
 {isOutbound && (
 <View
 style={[
 styles.statePill,
 {
 backgroundColor: theme.bgAlt,
 borderColor: theme.border,
 },
 ]}
 >
 <Text style={[styles.statePillText, { color: theme.textMuted }]}>
 Pending
 </Text>
 </View>
 )}
 {isDeclined && (
 <View
 style={[
 styles.statePill,
 {
 backgroundColor: `${theme.destructive}15`,
 borderColor: `${theme.destructive}55`,
 },
 ]}
 >
 <Text style={[styles.statePillText, { color: theme.destructive }]}>
 Declined
 </Text>
 </View>
 )}
 <Text
 style={[
 styles.preview,
 markedUnread && {
 color: theme.text,
 fontWeight: "600",
 },
 ]}
 numberOfLines={1}
 >
 {row.lastBody || sub || "No messages yet"}
 </Text>
 </View>
 </View>
 {/* Declined rows get an inline trash button so the user can
 clear the thread without opening it. */}
 {isDeclined && (
 <Pressable
 onPress={(e) => {
 e.stopPropagation?.();
 onDelete();
 }}
 hitSlop={6}
 style={({ pressed }) => [
 styles.deleteIconBtn,
 pressed && { opacity: 0.7 },
 ]}
 >
 <Trash2 size={16} color={theme.destructive} />
 </Pressable>
 )}

 {/* Inline Accept button on inbound rows. Big enough to tap
 comfortably; uses the gold primary so the action stands out. */}
 {isInbound && (
 <Pressable
 onPress={(e) => {
 e.stopPropagation?.();
 onAccept();
 }}
 disabled={accepting}
 hitSlop={6}
 style={({ pressed }) => [
 styles.acceptBtn,
 pressed && { opacity: 0.85 },
 accepting && { opacity: 0.5 },
 ]}
 >
 {accepting ? (
 <ActivityIndicator color={theme.textOnPrimary} size="small" />
 ) : (
 <>
 <Check size={14} color={theme.textOnPrimary} strokeWidth={3} />
 <Text style={styles.acceptText}>Accept</Text>
 </>
 )}
 </Pressable>
 )}
 </Pressable>
 );
};

const makeStyles = (theme: ThemePalette) =>
 StyleSheet.create({
 safe: { flex: 1, backgroundColor: theme.bg },
 center: { flex: 1, alignItems: "center", justifyContent: "center" },
 header: { padding: 20, paddingBottom: 12 },
 eyebrow: {
 flexDirection: "row",
 alignItems: "center",
 gap: 6,
 paddingHorizontal: 10,
 paddingVertical: 5,
 borderWidth: 1,
 borderColor: theme.goldSoft,
 backgroundColor: theme.goldGlow,
 borderRadius: 2,
 alignSelf: "flex-start",
 marginBottom: 12,
 },
 eyebrowText: {
 color: theme.gold,
 fontSize: 11,
 fontFamily: fonts.mono,
 letterSpacing: 2,
 textTransform: "uppercase",
 },
 h1: {
 color: theme.text,
 fontSize: 36,
 fontFamily: fonts.display,
 letterSpacing: -0.5,
 },
 empty: {
 flex: 1,
 alignItems: "center",
 justifyContent: "center",
 paddingHorizontal: 36,
 gap: 10,
 },
 emptyTitle: {
 color: theme.text,
 fontSize: 16,
 fontWeight: "600",
 },
 emptyBody: {
 color: theme.textDim,
 fontSize: 13.5,
 textAlign: "center",
 lineHeight: 19,
 },
 row: {
 flexDirection: "row",
 alignItems: "center",
 gap: 12,
 padding: 14,
 paddingHorizontal: 16,
 },
 avatar: {
 width: 44,
 height: 44,
 borderRadius: 22,
 borderWidth: 1,
 borderColor: theme.goldSoft,
 },
 avatarFallback: {
 width: 44,
 height: 44,
 borderRadius: 22,
 borderWidth: 1,
 borderColor: theme.goldSoft,
 backgroundColor: theme.goldGlow,
 alignItems: "center",
 justifyContent: "center",
 },
 avatarInitials: {
 color: theme.gold,
 fontFamily: fonts.display,
 fontSize: 17,
 },
 // Small gold pip overlaid on the avatar's top-right when the user
 // has marked this thread unread. Same visual language as the
 // web's threadUnread dot.
 unreadDot: {
 position: "absolute",
 top: -2,
 right: -2,
 width: 12,
 height: 12,
 borderRadius: 6,
 backgroundColor: theme.gold,
 borderWidth: 2,
 borderColor: theme.bg,
 },
 rowHead: {
 flexDirection: "row",
 justifyContent: "space-between",
 alignItems: "center",
 gap: 8,
 },
 name: {
 flex: 1,
 color: theme.text,
 fontSize: 15,
 fontWeight: "600",
 letterSpacing: -0.2,
 },
 time: {
 color: theme.textDim,
 fontFamily: fonts.mono,
 fontSize: 10,
 letterSpacing: 0.4,
 },
 metaRow: {
 flexDirection: "row",
 alignItems: "center",
 gap: 8,
 marginTop: 4,
 },
 statePill: {
 paddingHorizontal: 8,
 paddingVertical: 3,
 borderRadius: 999,
 borderWidth: 1,
 },
 statePillText: {
 fontSize: 10.5,
 fontWeight: "600",
 letterSpacing: 0.2,
 },
 preview: {
 flex: 1,
 color: theme.textMuted,
 fontSize: 12.5,
 },
 acceptBtn: {
 flexDirection: "row",
 alignItems: "center",
 gap: 6,
 paddingHorizontal: 14,
 paddingVertical: 10,
 borderRadius: 999,
 backgroundColor: theme.gold,
 },
 acceptText: {
 color: theme.textOnPrimary,
 fontSize: 13,
 fontWeight: "700",
 letterSpacing: 0.2,
 },
 deleteIconBtn: {
 width: 32,
 height: 32,
 alignItems: "center",
 justifyContent: "center",
 },
 });
