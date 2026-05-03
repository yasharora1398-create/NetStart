import { useCallback, useState } from "react";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Briefcase,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  MapPin,
  Pencil,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import {
  getAvatarUrl,
  getCandidatesByIds,
  getProjectById,
  listApplicationsForProject,
  removePerson,
  setProjectPublished,
  updateApplicationStatus,
  type IncomingApplication,
} from "@/lib/api";
import type { Candidate, Project } from "@/lib/types";
import { fonts, theme } from "@/lib/theme";

type Tab = "saved" | "applications";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [saved, setSaved] = useState<Candidate[]>([]);
  const [apps, setApps] = useState<IncomingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("saved");
  const [acting, setActing] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const proj = await getProjectById(id);
      setProject(proj);
      if (proj) {
        const [people, applications] = await Promise.all([
          proj.savedPersonIds.length > 0
            ? getCandidatesByIds(proj.savedPersonIds)
            : Promise.resolve([] as Candidate[]),
          listApplicationsForProject(proj.id).catch(() => [] as IncomingApplication[]),
        ]);
        setSaved(people);
        setApps(applications);
      }
    } catch {
      // silent — empty state will render
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleUnsave = (candidate: Candidate) => {
    if (!project) return;
    Alert.alert(
      "Remove from saved?",
      `${candidate.fullName || "Candidate"} won't appear in this project's saved list.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setActing(candidate.userId);
            try {
              await removePerson(project.id, candidate.userId);
              setSaved((prev) =>
                prev.filter((c) => c.userId !== candidate.userId),
              );
              setProject((p) =>
                p
                  ? {
                      ...p,
                      savedPersonIds: p.savedPersonIds.filter(
                        (x) => x !== candidate.userId,
                      ),
                    }
                  : p,
              );
            } catch (err) {
              Alert.alert(
                "Could not remove",
                err instanceof Error ? err.message : "Try again.",
              );
            } finally {
              setActing(null);
            }
          },
        },
      ],
    );
  };

  const handleTogglePublish = async () => {
    if (!project) return;
    const next = !project.isPublished;
    setProject((p) => (p ? { ...p, isPublished: next } : p));
    try {
      await setProjectPublished(project.id, next);
    } catch (err) {
      // revert on failure
      setProject((p) => (p ? { ...p, isPublished: !next } : p));
      Alert.alert(
        "Could not update",
        err instanceof Error ? err.message : "Try again.",
      );
    }
  };

  const handleAppDecision = async (
    appId: string,
    next: "accepted" | "rejected" | "pending",
  ) => {
    setActing(appId);
    try {
      await updateApplicationStatus(appId, next);
      setApps((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: next } : a)),
      );
    } catch (err) {
      Alert.alert(
        "Could not update",
        err instanceof Error ? err.message : "Try again.",
      );
    } finally {
      setActing(null);
    }
  };

  if (loading && !project) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Not found</Text>
          <View style={{ width: 20 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.empty}>This project couldn't be loaded.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {project.title}
          </Text>
          <Pressable
            onPress={() =>
              router.push(`/edit-project?id=${project.id}` as never)
            }
            hitSlop={12}
          >
            <Pencil size={18} color={theme.gold} />
          </Pressable>
        </View>

        <View style={styles.heroBox}>
          <View style={styles.eyebrow}>
            <Sparkles size={11} color={theme.gold} />
            <Text style={styles.eyebrowText}>Project</Text>
            <View
              style={[
                styles.publishedPill,
                project.isPublished
                  ? styles.publishedOn
                  : styles.publishedOff,
              ]}
            >
              <Text
                style={[
                  styles.publishedPillText,
                  project.isPublished
                    ? { color: theme.emerald }
                    : { color: theme.textMuted },
                ]}
              >
                {project.isPublished ? "Public" : "Draft"}
              </Text>
            </View>
          </View>
          <Text style={styles.h1}>{project.title}</Text>
          {project.description ? (
            <Text style={styles.desc} numberOfLines={3}>
              {project.description}
            </Text>
          ) : null}
          <Pressable
            onPress={handleTogglePublish}
            style={({ pressed }) => [
              styles.publishToggle,
              pressed && { opacity: 0.85 },
            ]}
          >
            {project.isPublished ? (
              <>
                <EyeOff size={12} color={theme.textMuted} />
                <Text style={styles.publishToggleText}>Unpublish</Text>
              </>
            ) : (
              <>
                <Eye size={12} color={theme.gold} />
                <Text
                  style={[styles.publishToggleText, { color: theme.gold }]}
                >
                  Publish to Talent
                </Text>
              </>
            )}
          </Pressable>
          {(project.criteria.commitment || project.criteria.location) && (
            <View style={styles.metaRow}>
              {project.criteria.commitment ? (
                <View style={styles.metaChip}>
                  <Briefcase size={10} color={theme.gold} />
                  <Text style={styles.metaText}>
                    {project.criteria.commitment}
                  </Text>
                </View>
              ) : null}
              {project.criteria.location ? (
                <View style={styles.metaChip}>
                  <MapPin size={10} color={theme.gold} />
                  <Text style={styles.metaText}>
                    {project.criteria.location}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TabButton
            label={`Saved (${saved.length})`}
            active={tab === "saved"}
            onPress={() => setTab("saved")}
          />
          <TabButton
            label={`Applications (${apps.length})`}
            active={tab === "applications"}
            onPress={() => setTab("applications")}
          />
        </View>

        {tab === "saved" ? (
          saved.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.empty}>
                No saved candidates yet. Use the Match tab to start saving.
              </Text>
            </View>
          ) : (
            <FlatList
              data={saved}
              keyExtractor={(c) => c.userId}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => (
                <View style={{ height: 10 }} />
              )}
              renderItem={({ item: c }) => {
                const url = getAvatarUrl(c.avatarPath);
                return (
                  <View style={styles.row}>
                    {url ? (
                      <Image source={{ uri: url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitials}>
                          {(c.fullName[0] ?? "?").toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name} numberOfLines={1}>
                        {c.fullName || "Unnamed"}
                      </Text>
                      {c.headline ? (
                        <Text style={styles.sub} numberOfLines={1}>
                          {c.headline}
                        </Text>
                      ) : null}
                      {c.linkedinUrl ? (
                        <Pressable
                          onPress={() => Linking.openURL(c.linkedinUrl)}
                          style={styles.linkRow}
                        >
                          <ExternalLink size={11} color={theme.gold} />
                          <Text style={styles.linkText} numberOfLines={1}>
                            LinkedIn
                          </Text>
                          <ExternalLink size={10} color={theme.textDim} />
                        </Pressable>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => handleUnsave(c)}
                      hitSlop={6}
                      disabled={acting === c.userId}
                    >
                      <Trash2 size={16} color={theme.destructive} />
                    </Pressable>
                  </View>
                );
              }}
            />
          )
        ) : apps.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.empty}>
              No applications yet. Publish the project so candidates can apply.
            </Text>
          </View>
        ) : (
          <FlatList
            data={apps}
            keyExtractor={(a) => a.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item: app }) => {
              const url = getAvatarUrl(app.candidate.avatarPath);
              const busy = acting === app.id;
              return (
                <View style={styles.appCard}>
                  <View style={styles.appHead}>
                    {url ? (
                      <Image source={{ uri: url }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarInitials}>
                          {(app.candidate.fullName[0] ?? "?").toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name} numberOfLines={1}>
                        {app.candidate.fullName || "Unnamed"}
                      </Text>
                      {app.candidate.headline ? (
                        <Text style={styles.sub} numberOfLines={1}>
                          {app.candidate.headline}
                        </Text>
                      ) : null}
                    </View>
                    <View style={[styles.statusPill, statusStyle(app.status)]}>
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: statusColor(app.status) },
                        ]}
                      >
                        {statusLabel(app.status)}
                      </Text>
                    </View>
                  </View>

                  {app.message ? (
                    <Text style={styles.appMessage}>{app.message}</Text>
                  ) : null}

                  {app.candidate.skills.length > 0 ? (
                    <View style={styles.skillRow}>
                      {app.candidate.skills.slice(0, 6).map((s) => (
                        <View key={s} style={styles.skillChip}>
                          <Text style={styles.skillText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <View style={styles.appActions}>
                    {app.candidate.linkedinUrl ? (
                      <Pressable
                        onPress={() => Linking.openURL(app.candidate.linkedinUrl)}
                        style={styles.miniLink}
                      >
                        <ExternalLink size={12} color={theme.gold} />
                        <Text style={styles.miniLinkText}>LinkedIn</Text>
                      </Pressable>
                    ) : (
                      <View />
                    )}
                    <View style={styles.appBtns}>
                      {app.status !== "accepted" && (
                        <Pressable
                          onPress={() => handleAppDecision(app.id, "accepted")}
                          disabled={busy}
                          style={({ pressed }) => [
                            styles.actionBtn,
                            styles.actionAccept,
                            pressed && { opacity: 0.85 },
                          ]}
                        >
                          <Check size={13} color={theme.bg} />
                          <Text style={styles.actionAcceptText}>Accept</Text>
                        </Pressable>
                      )}
                      {app.status !== "rejected" && (
                        <Pressable
                          onPress={() => handleAppDecision(app.id, "rejected")}
                          disabled={busy}
                          style={({ pressed }) => [
                            styles.actionBtn,
                            styles.actionReject,
                            pressed && { opacity: 0.85 },
                          ]}
                        >
                          <X size={13} color={theme.destructive} />
                          <Text style={styles.actionRejectText}>Reject</Text>
                        </Pressable>
                      )}
                      {app.status !== "pending" && (
                        <Pressable
                          onPress={() => handleAppDecision(app.id, "pending")}
                          disabled={busy}
                          hitSlop={6}
                          style={styles.actionReset}
                        >
                          <Undo2 size={13} color={theme.textMuted} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const TabButton = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.tab,
      active && styles.tabActive,
      pressed && { opacity: 0.85 },
    ]}
  >
    <Text style={[styles.tabText, active && { color: theme.gold }]}>
      {label}
    </Text>
  </Pressable>
);

const statusLabel = (s: string) =>
  s === "pending"
    ? "Pending"
    : s === "accepted"
      ? "Accepted"
      : s === "rejected"
        ? "Rejected"
        : "Withdrawn";

const statusColor = (s: string) =>
  s === "accepted"
    ? theme.emerald
    : s === "rejected"
      ? theme.destructive
      : s === "withdrawn"
        ? theme.textMuted
        : theme.gold;

const statusStyle = (s: string) => {
  const c = statusColor(s);
  return { borderColor: c + "66", backgroundColor: c + "1A" };
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  empty: { color: theme.textMuted, textAlign: "center", lineHeight: 20 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 16,
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  heroBox: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  eyebrowText: {
    color: theme.gold,
    fontSize: 10,
    fontFamily: fonts.mono,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  publishedPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 2,
  },
  publishedOn: {
    borderColor: "rgba(52,211,153,0.4)",
    backgroundColor: "rgba(52,211,153,0.1)",
  },
  publishedOff: { borderColor: theme.border, backgroundColor: theme.bgElev },
  publishedPillText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  h1: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 24,
    marginBottom: 6,
  },
  desc: { color: theme.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
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
  publishToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 2,
    marginTop: 10,
  },
  publishToggleText: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tab: { paddingBottom: 10, paddingTop: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.gold },
  tabText: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  list: { padding: 20, paddingBottom: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 4,
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
  name: { color: theme.text, fontSize: 14, fontWeight: "600" },
  sub: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  linkText: {
    color: theme.gold,
    fontSize: 11,
    fontFamily: fonts.mono,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  appCard: {
    padding: 14,
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    gap: 10,
  },
  appHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  appMessage: {
    color: theme.text,
    fontSize: 13,
    lineHeight: 19,
    paddingTop: 4,
  },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  skillChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 2,
  },
  skillText: { color: theme.textMuted, fontSize: 10 },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 2,
  },
  statusPillText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  appActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  miniLink: { flexDirection: "row", alignItems: "center", gap: 5 },
  miniLinkText: {
    color: theme.gold,
    fontSize: 11,
    fontFamily: fonts.mono,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  appBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 3,
  },
  actionAccept: { backgroundColor: theme.gold },
  actionAcceptText: { color: theme.bg, fontSize: 11, fontWeight: "700" },
  actionReject: {
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  actionRejectText: {
    color: theme.destructive,
    fontSize: 11,
    fontWeight: "600",
  },
  actionReset: {
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
});
