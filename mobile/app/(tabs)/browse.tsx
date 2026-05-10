import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowRight,
  Briefcase,
  Compass,
  MapPin,
  Search,
} from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import {
  getAvatarUrl,
  listPublishedProjects,
} from "@/lib/api";
import type { PublicProject } from "@/lib/types";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { MothEmptyState } from "@/components/MothEmptyState";
import { MothLoader } from "@/components/MothLoader";

export default function BrowseScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  // Symmetric to the Match screen's redirect: a founder who lands
  // on Browse (via stale state or a direct deep link) bounces back
  // to their swipe deck. Tab bar already hides Browse from them.
  const role = user?.user_metadata?.role as string | undefined;
  useEffect(() => {
    if (role === "founder") {
      router.replace("/(tabs)" as never);
    }
  }, [role, router]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listPublishedProjects()
      .then((list) => {
        if (!cancelled) setProjects(list);
      })
      .catch(() => {
        // silent — empty state will show
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? projects.filter((p) => {
        const haystack = `${p.title} ${p.description} ${p.criteria.skills.join(
          " ",
        )} ${p.criteria.commitment} ${p.criteria.location} ${p.founderFullName} ${p.founderHeadline}`.toLowerCase();
        return haystack.includes(q);
      })
    : projects;

  // Stage 4: "Apply" was removed in favor of a universal chat
  // request. Tapping the CTA on a card now opens a chat thread with
  // the founder; the builder's first message creates the pending row.
  const handleRequestChat = (project: PublicProject) => {
    if (project.ownerId === user?.id) return;
    router.push(`/chat/${project.ownerId}` as never);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.eyebrow}>
            <Compass size={12} color={theme.gold} />
            <Text style={styles.eyebrowText}>Browse</Text>
          </View>
          {/* Magnifying glass routes to /search where filters tighten
              criteria for a single search session. */}
          <Pressable
            onPress={() => router.push("/search" as never)}
            hitSlop={12}
            style={({ pressed }) => [
              styles.searchIconBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Search size={18} color={theme.gold} />
          </Pressable>
        </View>
        <Text style={styles.h1}>Open projects.</Text>

        <View style={styles.searchWrap}>
          <Search
            size={14}
            color={theme.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Quick filter by title, skill, founder..."
            placeholderTextColor={theme.textDim}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <MothLoader size={160} />
        </View>
      ) : filtered.length === 0 ? (
        <MothEmptyState
          variant={query ? "filters" : "platform"}
          title={query ? "No matches." : "Nothing here yet."}
          sub={
            query
              ? "Hawk-moths home in by scent, and your filters narrow the bouquet. Loosen a few and the field opens up."
              : "Check back soon. Founders are spinning things up."
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item: p }) => {
            const isOwn = p.ownerId === user?.id;
            const founderUrl = getAvatarUrl(p.founderAvatarPath);
            return (
              <Pressable
                onPress={() => router.push(`/project/${p.id}` as never)}
                style={({ pressed }) => [
                  styles.card,
                  pressed && { opacity: 0.92 },
                ]}
              >
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  {isOwn && (
                    <View style={styles.ownPill}>
                      <Text style={styles.ownPillText}>Yours</Text>
                    </View>
                  )}
                </View>

                {(p.founderFullName || p.founderHeadline) && (
                  <Pressable
                    onPress={() =>
                      router.push(`/u/${p.ownerId}` as never)
                    }
                    style={({ pressed }) => [
                      styles.founderRow,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    {founderUrl ? (
                      <Image
                        source={{ uri: founderUrl }}
                        style={styles.founderAvatar}
                      />
                    ) : (
                      <View style={styles.founderAvatarFallback}>
                        <Text style={styles.founderInitials}>
                          {(p.founderFullName[0] ?? "?").toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.founderName} numberOfLines={1}>
                        by {p.founderFullName || "Anonymous"}
                      </Text>
                      {p.founderHeadline ? (
                        <Text style={styles.founderHeadline} numberOfLines={1}>
                          {p.founderHeadline}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                )}

                {p.description ? (
                  <Text style={styles.cardDesc} numberOfLines={3}>
                    {p.description}
                  </Text>
                ) : null}

                {(p.businessType || p.criteria.commitment || p.criteria.location) && (
                  <View style={styles.metaRow}>
                    {p.businessType ? (
                      <View
                        style={[
                          styles.metaChip,
                          { backgroundColor: theme.goldGlow, borderColor: theme.goldSoft },
                        ]}
                      >
                        <Text style={[styles.metaText, { color: theme.gold }]}>
                          {p.businessType}
                        </Text>
                      </View>
                    ) : null}
                    {p.criteria.commitment ? (
                      <View style={styles.metaChip}>
                        <Briefcase size={10} color={theme.gold} />
                        <Text style={styles.metaText}>
                          {p.criteria.commitment}
                        </Text>
                      </View>
                    ) : null}
                    {p.criteria.location ? (
                      <View style={styles.metaChip}>
                        <MapPin size={10} color={theme.gold} />
                        <Text style={styles.metaText}>
                          {p.criteria.location}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {p.criteria.skills.length > 0 && (
                  <View style={styles.skillRow}>
                    {p.criteria.skills.slice(0, 5).map((s) => (
                      <View key={s} style={styles.skillChip}>
                        <Text style={styles.skillText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.footer}>
                  <Text style={styles.posted}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </Text>
                  {isOwn ? (
                    <Text style={styles.ownLabel}>Public listing</Text>
                  ) : (
                    <Pressable
                      onPress={() => handleRequestChat(p)}
                      style={({ pressed }) => [
                        styles.applyBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Text style={styles.applyText}>Message</Text>
                      <ArrowRight size={14} color={theme.bg} />
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (theme: ThemePalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { padding: 20, paddingBottom: 12 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    alignItems: "center",
    justifyContent: "center",
  },
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
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  searchWrap: {
    position: "relative",
    justifyContent: "center",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    paddingLeft: 36,
    paddingRight: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 14,
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
  card: {
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    padding: 16,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 20,
    flex: 1,
    lineHeight: 24,
  },
  ownPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    borderRadius: 2,
  },
  ownPillText: {
    color: theme.gold,
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  founderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  founderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.goldSoft,
  },
  founderAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  founderInitials: {
    color: theme.gold,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  founderName: { color: theme.text, fontSize: 13.5, fontWeight: "600" },
  founderHeadline: {
    color: theme.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  cardDesc: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 2,
  },
  metaText: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 12 },
  skillChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    borderRadius: 2,
  },
  skillText: { color: theme.text, fontSize: 10 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  posted: {
    color: theme.textDim,
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  ownLabel: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderRadius: 2,
  },
  statusPillText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.gold,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 3,
  },
  applyText: { color: theme.bg, fontSize: 12, fontWeight: "700" },
});
