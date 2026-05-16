import { useMemo, useCallback, useState } from "react";
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
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  MapPin,
  Pencil,
  Sparkles,
  Star,
  Trash2,
  Undo2,
  X,
} from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import {
  getAvatarUrl,
  getCandidatesByIds,
  getProjectById,
  getPublicFounder,
  listApplicationsForProject,
  removePerson,
  setProjectLifecycle,
  setProjectPublished,
  updateApplicationStatus,
  type IncomingApplication,
  type PublicFounder,
} from "@/lib/api";
import type {
  Candidate,
  Project,
  ProjectLifecycle,
  PublicProject,
} from "@/lib/types";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import {
  addSavedProject,
  refreshSavedProject,
  removeSavedProject,
  setActiveSavedProject,
  useActiveSavedProjectId,
  useIsProjectSaved,
} from "@/lib/savedProjects";
import { MothEmptyState } from "@/components/MothEmptyState";
import { MothLoader } from "@/components/MothLoader";

// Re-pack a (private) Project + (public) Founder pair into the
// PublicProject shape the local saved-projects store expects.
const toPublicProject = (
  p: Project,
  f: PublicFounder | null,
): PublicProject => ({
  id: p.id,
  ownerId: p.ownerId,
  title: p.title,
  description: p.description,
  criteria: p.criteria,
  businessType: p.businessType,
  lifecycleState: p.lifecycleState,
  createdAt: p.createdAt,
  founderFullName: f?.fullName ?? "",
  founderHeadline: f?.headline ?? "",
  founderAvatarPath: f?.avatarPath ?? null,
});

type Tab = "saved" | "applications";

export default function ProjectDetailScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [saved, setSaved] = useState<Candidate[]>([]);
  const [apps, setApps] = useState<IncomingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("saved");
  const [acting, setActing] = useState<string | null>(null);
  // Builder-side state (only fetched when viewer != owner)
  const [founder, setFounder] = useState<PublicFounder | null>(null);

  const isOwner = Boolean(
    project && user && project.ownerId === user.id,
  );

  // Saved-projects state — only meaningful for the builder POV. The
  // hooks no-op cleanly for owners (they just won't render the
  // bookmark UI). Reading the active id keeps the focus star in sync
  // when set/cleared from the Saved tab.
  const isSaved = useIsProjectSaved(id ?? "");
  const activeSavedId = useActiveSavedProjectId();
  const isFocus = Boolean(id) && activeSavedId === id;

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const proj = await getProjectById(id);
      setProject(proj);
      if (!proj) return;
      const ownerView = Boolean(user && proj.ownerId === user.id);
      if (ownerView) {
        const [people, applications] = await Promise.all([
          proj.savedPersonIds.length > 0
            ? getCandidatesByIds(proj.savedPersonIds)
            : Promise.resolve([] as Candidate[]),
          listApplicationsForProject(proj.id).catch(
            () => [] as IncomingApplication[],
          ),
        ]);
        setSaved(people);
        setApps(applications);
      } else {
        // Builder POV: fetch founder profile so the row can render
        // their name + LinkedIn alongside the project body.
        const f = await getPublicFounder(proj.ownerId).catch(() => null);
        setFounder(f);
        // If the builder already saved this project, freshen the
        // cached row so the Saved tab reflects the latest title/desc
        // without forcing them to unsave + resave.
        refreshSavedProject(toPublicProject(proj, f));
      }
    } catch {
      // silent — empty state will render
    } finally {
      setLoading(false);
    }
  }, [id, user]);

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

  const handleSetLifecycle = async (next: ProjectLifecycle) => {
    if (!project || project.lifecycleState === next) return;
    const prevState = project.lifecycleState;
    setProject((p) => (p ? { ...p, lifecycleState: next } : p));
    try {
      await setProjectLifecycle(project.id, next);
    } catch (err) {
      setProject((p) => (p ? { ...p, lifecycleState: prevState } : p));
      Alert.alert(
        "Couldn't update",
        err instanceof Error ? err.message : "Try again.",
      );
    }
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
          <MothLoader size={160} />
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
          {isOwner ? (
            <Pressable
              onPress={() =>
                router.push(`/edit-project?id=${project.id}` as never)
              }
              hitSlop={12}
            >
              <Pencil size={18} color={theme.gold} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                if (isSaved) {
                  removeSavedProject(project.id);
                } else {
                  addSavedProject(toPublicProject(project, founder));
                }
              }}
              hitSlop={12}
              accessibilityLabel={
                isSaved ? "Remove from saved" : "Save project"
              }
            >
              {isSaved ? (
                <BookmarkCheck size={20} color={theme.gold} fill={theme.gold} />
              ) : (
                <Bookmark size={20} color={theme.text} />
              )}
            </Pressable>
          )}
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
          {isOwner ? (
            <View style={styles.ownerControlsRow}>
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

              {/* Lifecycle picker. Only Active projects appear in
                  Browse / Search; the others stay listed for the
                  owner but are hidden from builders. */}
              {(["active", "paused", "filled", "closed"] as const).map(
                (s) => {
                  const on = project.lifecycleState === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => handleSetLifecycle(s)}
                      style={({ pressed }) => [
                        styles.lifecycleChip,
                        on && styles.lifecycleChipOn,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.lifecycleChipText,
                          on && { color: theme.gold },
                        ]}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>
          ) : null}
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

        {/* Tabs (owner only). Builders see the public detail view below. */}
        {isOwner && (
          <>
        <View style={styles.tabs}>
          <TabButton
            label={`Saved (${saved.length})`}
            active={tab === "saved"}
            onPress={() => setTab("saved")}
            styles={styles}
            theme={theme}
          />
          <TabButton
            label={`Applications (${apps.length})`}
            active={tab === "applications"}
            onPress={() => setTab("applications")}
            styles={styles}
            theme={theme}
          />
        </View>

        {tab === "saved" ? (
          saved.length === 0 ? (
            <MothEmptyState
              variant="saves"
              title="No saved candidates yet."
              sub="Use the Match tab to start saving builders against this project."
            />
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
          <MothEmptyState
            variant="apps"
            title="No applications yet."
            sub="Publish the project so candidates can apply. Their pitches land here."
          />
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
                    <View style={[styles.statusPill, statusStyle(app.status, theme)]}>
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: statusColor(app.status, theme) },
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
          </>
        )}

        {/* Builder POV — when the viewer is not the project owner. */}
        {!isOwner && (
          <BuilderProjectBody
            project={project}
            founder={founder}
            isSaved={isSaved}
            isFocus={isFocus}
            onToggleFocus={() => {
              // Auto-save before promoting to focus so the builder
              // doesn't have to do it in two taps.
              if (!isSaved) {
                addSavedProject(toPublicProject(project, founder));
              }
              setActiveSavedProject(project.id);
            }}
            onMessageFounder={() =>
              router.push(`/chat/${project.ownerId}` as never)
            }
            styles={styles}
            theme={theme}
          />
        )}
      </SafeAreaView>
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// Builder-facing project detail body. Shown when a non-owner
// (typically a builder) navigates to /project/[id]. Renders the
// founder profile + Apply CTA, or a status pill if they've already
// applied.
// ────────────────────────────────────────────────────────────────
const BuilderProjectBody = ({
  project,
  founder,
  isSaved,
  isFocus,
  onToggleFocus,
  onMessageFounder,
  styles,
  theme,
}: {
  project: Project;
  founder: PublicFounder | null;
  isSaved: boolean;
  isFocus: boolean;
  onToggleFocus: () => void;
  onMessageFounder: () => void;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
}) => {
  const founderUrl = getAvatarUrl(founder?.avatarPath ?? null);
  const skills = project.criteria.skills;
  return (
    <View style={styles.builderBody}>
      {project.description ? (
        <View style={styles.builderSection}>
          <Text style={styles.builderSectionLabel}>About this project</Text>
          <Text style={styles.builderProse}>{project.description}</Text>
        </View>
      ) : null}

      {skills.length > 0 ? (
        <View style={styles.builderSection}>
          <Text style={styles.builderSectionLabel}>Skills they're after</Text>
          <View style={styles.skillRow}>
            {skills.map((s) => (
              <View key={s} style={styles.skillChip}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {founder && (
        <View style={styles.builderSection}>
          <Text style={styles.builderSectionLabel}>The founder</Text>
          <View style={styles.builderFounderCard}>
            {founderUrl ? (
              <Image source={{ uri: founderUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {(founder.fullName[0] ?? "?").toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {founder.fullName || "Anonymous founder"}
              </Text>
              {founder.headline ? (
                <Text style={styles.sub} numberOfLines={2}>
                  {founder.headline}
                </Text>
              ) : null}
              {founder.linkedinUrl ? (
                <Pressable
                  onPress={() => Linking.openURL(founder.linkedinUrl)}
                  style={styles.linkRow}
                >
                  <ExternalLink size={11} color={theme.gold} />
                  <Text style={styles.linkText}>LinkedIn</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      )}

      {/* Sticky CTA cluster: focus toggle (when saved) + Message
          founder primary action. The builder's first message creates
          the pending request. */}
      <View style={styles.builderCtaWrap}>
        {isSaved ? (
          <Pressable
            onPress={onToggleFocus}
            style={({ pressed }) => [
              styles.focusToggleBtn,
              isFocus && styles.focusToggleBtnOn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Star
              size={13}
              color={theme.gold}
              fill={isFocus ? theme.gold : "transparent"}
            />
            <Text style={styles.focusToggleText}>
              {isFocus ? "Current focus" : "Set as focus"}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onMessageFounder}
          style={({ pressed }) => [
            styles.builderApplyBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.builderApplyText}>
            Message {founder?.fullName.split(" ")[0] || "founder"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const TabButton = ({
  label,
  active,
  onPress,
  styles,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
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

const statusColor = (s: string, theme: ThemePalette) =>
  s === "accepted"
    ? theme.emerald
    : s === "rejected"
      ? theme.destructive
      : s === "withdrawn"
        ? theme.textMuted
        : theme.gold;

const statusStyle = (s: string, theme: ThemePalette) => {
  const c = statusColor(s, theme);
  return { borderColor: c + "66", backgroundColor: c + "1A" };
};

const makeStyles = (theme: ThemePalette) => StyleSheet.create({
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
  ownerControlsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  lifecycleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 2,
  },
  lifecycleChipOn: {
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
  },
  lifecycleChipText: {
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
  // Builder POV: body sections, founder card, apply CTA / status pill
  builderBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  builderSection: { marginBottom: 22 },
  builderSectionLabel: {
    color: theme.gold,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    marginBottom: 8,
  },
  builderProse: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 21,
  },
  builderFounderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
  },
  builderCtaWrap: {
    marginTop: "auto",
    gap: 10,
  },
  focusToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bgElev,
  },
  focusToggleBtnOn: {
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
  },
  focusToggleText: {
    color: theme.gold,
    fontSize: 12,
    fontFamily: fonts.mono,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  builderApplyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    backgroundColor: theme.gold,
    borderRadius: 12,
  },
  builderApplyText: {
    color: theme.textOnPrimary,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  builderStatus: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  builderStatusText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
