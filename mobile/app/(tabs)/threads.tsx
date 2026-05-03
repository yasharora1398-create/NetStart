import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Inbox, MessageCircle } from "lucide-react-native";
import {
  getAvatarUrl,
  getCandidatesByIds,
  listNotifications,
  type AppNotification,
} from "@/lib/api";
import type { Candidate } from "@/lib/types";
import { fonts, theme } from "@/lib/theme";

const formatRelative = (iso: string): string => {
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

type Item = {
  notif: AppNotification;
  candidate?: Candidate;
};

export default function ThreadsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listNotifications()
      .then(async (notifs) => {
        const chats = notifs.filter(
          (n) =>
            n.type === "chat_request" ||
            n.type === "chat_accepted" ||
            n.type === "founder_outreach",
        );
        const ids = chats
          .map((n) => n.fromUserId)
          .filter((x): x is string => Boolean(x));
        const candidates =
          ids.length > 0 ? await getCandidatesByIds(ids).catch(() => []) : [];
        const byId = new Map<string, Candidate>(
          candidates.map((c) => [c.userId, c]),
        );
        const result: Item[] = chats.map((notif) => ({
          notif,
          candidate: notif.fromUserId
            ? byId.get(notif.fromUserId)
            : undefined,
        }));
        if (!cancelled) setItems(result);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
          <ActivityIndicator color={theme.gold} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Inbox size={20} color={theme.gold} />
          <Text style={styles.emptyTitle}>No threads yet</Text>
          <Text style={styles.emptyBody}>
            Chat requests and outreach from founders will land here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.notif.id}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: theme.border }} />
          )}
          renderItem={({ item }) => {
            const { notif, candidate } = item;
            const url = getAvatarUrl(candidate?.avatarPath ?? null);
            const display =
              candidate?.fullName || notif.title || "NetStart";
            const sub = candidate?.headline || notif.body || "";
            const tappable = Boolean(notif.fromUserId);
            const onPress = () => {
              if (notif.fromUserId) {
                router.push(`/u/${notif.fromUserId}` as never);
              }
            };
            return (
              <Pressable
                onPress={onPress}
                disabled={!tappable}
                style={({ pressed }) => [
                  styles.row,
                  pressed && tappable && { backgroundColor: theme.bgElev },
                ]}
              >
                {url ? (
                  <Image source={{ uri: url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>
                      {(display[0] ?? "?").toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.rowHead}>
                    <Text
                      style={[
                        styles.name,
                        !notif.readAt && { fontWeight: "700" },
                      ]}
                      numberOfLines={1}
                    >
                      {display}
                    </Text>
                    <Text style={styles.time}>
                      {formatRelative(notif.createdAt)}
                    </Text>
                  </View>
                  {sub ? (
                    <Text
                      style={[
                        styles.preview,
                        !notif.readAt && { color: theme.text },
                      ]}
                      numberOfLines={2}
                    >
                      {sub}
                    </Text>
                  ) : null}
                </View>
                {!notif.readAt && <View style={styles.unreadDot} />}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { padding: 40, alignItems: "center" },
  emptyTitle: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 20,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyBody: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
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
    fontSize: 16,
  },
  rowHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 2,
  },
  name: { color: theme.text, fontSize: 14, flex: 1 },
  time: {
    color: theme.textDim,
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  preview: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.gold,
  },
});
