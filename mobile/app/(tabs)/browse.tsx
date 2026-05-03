import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
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
  createApplication,
  getAvatarUrl,
  listMyApplications,
  listPublishedProjects,
} from "@/lib/api";
import type {
  ApplicationStatus,
  PublicProject,
} from "@/lib/types";
import { fonts, theme } from "@/lib/theme";

export default function BrowseScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [applied, setApplied] = useState<Map<string, ApplicationStatus>>(
    new Map(),
  );
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([listPublishedProjects(), listMyApplications()])
      .then(([list, mine]) => {
        if (cancelled) return;
        setProjects(list);
        const map = new Map<string, ApplicationStatus>();
        for (const a of mine) map.set(a.projectId, a.status);
        setApplied(map);
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

  const handleApply = (project: PublicProject) => {
    if (project.ownerId === user?.id) return;
    Alert.prompt(
      `Apply to ${project.title}`,
      "Pitch yourself in a short note (min 10 chars).",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async (text?: string) => {
            const note = (text ?? "").trim();
            if (note.length < 10) {
              Alert.alert("Too short", "Pitch yourself in at least 10 chars.");
              return;
            }
            try {
              await createApplication(project.id, note);
              setApplied((prev) => {
                const next = new Map(prev);
                next.set(project.id, "pending");
                return next;
              });
              Alert.alert("Sent", "Your application is on its way.");
            } catch (err) {
              const m =
                err instanceof Error
                  ? err.message
                  : "Could not send.";
              Alert.alert(
                "Failed",
                m.includes("duplicate")
                  ? "You've already applied to this project."
                  : m,
              );
            }
          },
        },
      ],
      "plain-text",
      "",
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.eyebrow}>
          <Compass size={12} color={theme.gold} />
          <Text style={styles.eyebrowText}>Browse</Text>
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
            placeholder="Search title, skills, founder..."
            placeholderTextColor={theme.textDim}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.gold} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Compass size={20} color={theme.gold} />
          <Text style={styles.emptyTitle}>
            {query ? "No matches" : "Nothing here yet"}
          </Text>
          <Text style={styles.emptyBody}>
            {query
              ? "Try fewer or different keywords."
              : "Check back soon. Founders are spinning things up."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item: p }) => {
            const status = applied.get(p.id);
            const isOwn = p.ownerId === user?.id;
            const founderUrl = getAvatarUrl(p.founderAvatarPath);
            return (
              <View style={styles.card}>
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

                {(p.criteria.commitment || p.criteria.location) && (
                  <View style={styles.metaRow}>
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
                  ) : status ? (
                    <View style={[styles.statusPill, statusStyle(status)]}>
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: statusColor(status) },
                        ]}
                      >
                        {statusLabel(status)}
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => handleApply(p)}
                      style={({ pressed }) => [
                        styles.applyBtn,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Text style={styles.applyText}>Apply</Text>
                      <ArrowRight size={14} color={theme.bg} />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const statusLabel = (s: ApplicationStatus) =>
  s === "pending"
    ? "Applied"
    : s === "accepted"
      ? "Accepted"
      : s === "rejected"
        ? "Rejected"
        : "Withdrawn";

const statusColor = (s: ApplicationStatus) =>
  s === "accepted"
    ? theme.emerald
    : s === "rejected"
      ? theme.destructive
      : s === "withdrawn"
        ? theme.textMuted
        : theme.gold;

const statusStyle = (s: ApplicationStatus) => {
  const c = statusColor(s);
  return {
    borderColor: c + "66",
    backgroundColor: c + "1A",
  };
};

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
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
  },
  founderAvatarFallback: {
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  founderInitials: {
    color: theme.gold,
    fontFamily: fonts.display,
    fontSize: 11,
  },
  founderName: { color: theme.text, fontSize: 12 },
  founderHeadline: {
    color: theme.textDim,
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
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
