import { useCallback, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  LogOut,
  Moon,
  Pencil,
  Rocket,
  Settings as SettingsIcon,
  Sparkles,
  Star,
  Sun,
  Users,
  XCircle,
} from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/lib/auth";
import {
  emptyProfile,
  type Profile,
  type Project,
  type ReviewStatus,
} from "@/lib/types";
import {
  getAvatarUrl,
  getProfile,
  listProjects,
  setActiveProject,
  setOpenToWork,
} from "@/lib/api";

// Minimums copied from edit-candidate so the toggle gate logic is
// the same on both screens.
const BIO_MIN = 60;
const SKILLS_MIN = 2;
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { resetTutorial, triggerTutorialReplay } from "@/lib/tutorial";
import { readMetadataRole, updateRole, type Role } from "@/lib/userRole";
import { confirmSignOut } from "@/lib/confirmSignOut";

export default function MyNetScreen() {
  const { user, signOut } = useAuth();
  const { theme, mode, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(emptyProfile());
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  // Tracks the in-flight Open-to-work upsert so a double-tap can't
  // fire two writes simultaneously.
  const [openBusy, setOpenBusy] = useState(false);

  // Refetch every time the screen regains focus, so edits propagate.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let cancelled = false;
      setLoading(true);
      Promise.all([getProfile(user.id), listProjects(user.id)])
        .then(([p, pr]) => {
          if (cancelled) return;
          setProfile(p);
          setProjects(pr);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [user]),
  );

  if (loading) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <ActivityIndicator color={theme.gold} />
        </View>
      </Screen>
    );
  }

  const avatarUrl = getAvatarUrl(profile.avatarPath);
  const name = profile.fullName || user?.email || "Your profile";

  // Role chosen at signup (lives on the auth user's user_metadata).
  // Existing users without a role fall back to a heuristic: owning a
  // project means they're a founder, otherwise builder.
  const role: Role =
    readMetadataRole(user) ?? (projects.length > 0 ? "founder" : "builder");

  // Toggle role with confirmation. Persists to user_metadata so it
  // survives sign-out / reinstall. The warning copy spells out what
  // changes so a founder doesn't accidentally lose project context.
  const toggleRole = () => {
    const next: Role = role === "founder" ? "builder" : "founder";
    const title =
      next === "founder" ? "Switch to Founder?" : "Switch to Builder?";
    const body =
      next === "founder"
        ? "You'll see builders in Match instead of projects. Builders apply to your projects, and you'll need at least one project posted to start matching."
        : projects.length > 0
          ? `You have ${projects.length} project${projects.length === 1 ? "" : "s"} that will stay saved, but Match will switch to showing founders looking for builders. Switch back anytime.`
          : "You'll see founders posting projects in Match instead of builders. Switch back anytime.";
    Alert.alert(title, body, [
      { text: "Cancel", style: "cancel" },
      {
        text: `Switch to ${next === "founder" ? "Founder" : "Builder"}`,
        onPress: () => {
          void updateRole(next);
        },
      },
    ]);
  };

  // Open to work — gating logic mirrors edit-candidate so behaviour
  // is identical whether the user flips it here or in edit mode.
  const candidate = profile.candidate;
  const isAccepted = profile.reviewStatus === "accepted";
  const missing: string[] = [];
  if (!candidate.headline.trim()) missing.push("headline");
  if (candidate.bio.trim().length < BIO_MIN)
    missing.push(`pitch/bio (${candidate.bio.trim().length}/${BIO_MIN})`);
  if (candidate.skills.length < SKILLS_MIN)
    missing.push(`${SKILLS_MIN - candidate.skills.length} more skill`);
  if (!candidate.location.trim()) missing.push("location");
  if (!candidate.commitment.trim()) missing.push("commitment");
  const profileComplete = missing.length === 0;

  const handleToggleOpenToWork = async (next: boolean) => {
    if (!user || openBusy) return;
    setOpenBusy(true);
    // Optimistic toggle — local profile reflects the new value
    // immediately, reverts on error. No client-side gating: the
    // user can flip the switch in either direction freely. If
    // their profile is incomplete or pending review, the status
    // line below the toggle tells them what that means; the
    // switch itself never refuses to move.
    const previous = candidate.isOpenToWork;
    setProfile((p) => ({
      ...p,
      candidate: { ...p.candidate, isOpenToWork: next },
    }));
    try {
      await setOpenToWork(user.id, next);
    } catch (err) {
      setProfile((p) => ({
        ...p,
        candidate: { ...p.candidate, isOpenToWork: previous },
      }));
      Alert.alert(
        "Could not update",
        err instanceof Error ? err.message : "Try again.",
      );
    } finally {
      setOpenBusy(false);
    }
  };

  return (
    <Screen>
      <View style={styles.eyebrow}>
        <Sparkles size={12} color={theme.gold} />
        <Text style={styles.eyebrowText}>MyNet</Text>
      </View>
      <Text style={styles.h1}>{name}</Text>
      {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}

      {/* Role badge — shows the role picked at sign-up. Tap to switch. */}
      <Pressable
        onPress={toggleRole}
        style={({ pressed }) => [
          styles.roleBadge,
          pressed && { opacity: 0.75 },
        ]}
      >
        {role === "founder" ? (
          <Rocket size={12} color={theme.gold} />
        ) : (
          <Users size={12} color={theme.gold} />
        )}
        <Text style={styles.roleBadgeText}>
          {role === "founder" ? "Founder" : "Builder"}
        </Text>
        <Text style={styles.roleBadgeHint}>tap to switch</Text>
      </Pressable>

      {/* Open-to-work toggle — PINNED AT THE TOP of MyNet so the
          user can flip it from the main screen without entering
          Edit profile. Builder-only; founders don't have a
          candidate profile to flip on/off. */}
      {role === "builder" ? (
        <View style={styles.openCard}>
          <OpenToWorkRow
            value={profile.candidate.isOpenToWork}
            isAccepted={isAccepted}
            profileComplete={profileComplete}
            missing={missing}
            busy={openBusy}
            onToggle={(next) => void handleToggleOpenToWork(next)}
          />
        </View>
      ) : null}

      {/* Avatar + status pill */}
      <View style={styles.headerCard}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>
              {(name[0] ?? "?").toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <StatusPill status={profile.reviewStatus} />
          {profile.candidate.headline ? (
            <Text style={styles.headline}>{profile.candidate.headline}</Text>
          ) : (
            <Text style={styles.headlineMuted}>No headline yet</Text>
          )}
        </View>
      </View>

      {/* Rejected reason */}
      {profile.reviewStatus === "rejected" && profile.reviewReason ? (
        <View style={styles.rejectCard}>
          <Text style={styles.rejectLabel}>Reviewer note</Text>
          <Text style={styles.rejectBody}>{profile.reviewReason}</Text>
        </View>
      ) : null}

      {/* Credentials block. Founders see Website + Proof; builders
          see Resume. LinkedIn shows for both. */}
      <Section
        title="Credentials"
        onEdit={() => router.push("/edit-credentials" as never)}
        editLabel={
          profile.reviewStatus === "draft"
            ? "Submit"
            : profile.reviewStatus === "rejected"
              ? "Resubmit"
              : "Edit"
        }
      >
        <Row label="LinkedIn" value={profile.linkedinUrl || "Not set"} />
        {role === "founder" ? (
          <>
            <Row
              label="Website"
              value={profile.websiteUrl || "Not set"}
            />
            <Row
              label="Proof"
              value={profile.proof ? profile.proof.name : "Not uploaded"}
            />
          </>
        ) : (
          <Row
            label="Resume"
            value={profile.resume ? profile.resume.name : "Not uploaded"}
          />
        )}
      </Section>

      {/* Candidate profile only applies to builders. Founders are
          represented by their projects, not a candidate bio. */}
      {role === "builder" ? (
        <Section
          title="Candidate profile"
          onEdit={() => router.push("/edit-candidate" as never)}
        >
          <Row label="Headline" value={profile.candidate.headline || "-"} />
          <Row label="Location" value={profile.candidate.location || "-"} />
          <Row
            label="Commitment"
            value={profile.candidate.commitment || "-"}
          />
          <Row
            label="Skills"
            value={
              profile.candidate.skills.length > 0
                ? profile.candidate.skills.join(", ")
                : "-"
            }
          />
          {profile.candidate.bio ? (
            <Text style={styles.bio}>{profile.candidate.bio}</Text>
          ) : null}
        </Section>
      ) : null}

      {/* Projects */}
      <Section
        title={`Projects (${projects.length})`}
        onEdit={
          projects.length > 0
            ? () => router.push("/edit-project" as never)
            : undefined
        }
        editLabel="+ New"
      >
        {projects.length === 0 ? (
          role === "founder" ? (
            <Pressable
              onPress={() => router.push("/edit-project" as never)}
              style={({ pressed }) => [
                styles.onboardCard,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Rocket size={20} color={theme.gold} />
              <Text style={styles.onboardTitle}>Post your first project</Text>
              <Text style={styles.onboardBody}>
                Tell builders what you're building, the skills you need, and the
                commitment level. Takes about a minute. Once it's live,
                builders can apply.
              </Text>
              <View style={styles.onboardCta}>
                <Text style={styles.onboardCtaText}>Create project</Text>
                <ArrowRight size={14} color={theme.textOnPrimary} />
              </View>
            </Pressable>
          ) : (
            <Text style={styles.dim}>
              No projects yet. Switch to Founder if you want to post one.
            </Text>
          )
        ) : (
          projects.map((p) => {
            const isActive = profile.activeProjectId === p.id;
            const handleStar = async () => {
              if (!user) return;
              // Toggle: tap star on the active one to clear, on any
              // other to make it active. Optimistic UI.
              const next = isActive ? null : p.id;
              setProfile((prev) => ({ ...prev, activeProjectId: next }));
              try {
                await setActiveProject(user.id, next);
              } catch {
                // Revert on failure.
                setProfile((prev) => ({
                  ...prev,
                  activeProjectId: isActive ? p.id : null,
                }));
              }
            };
            return (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/project/${p.id}` as never)}
                style={({ pressed }) => [
                  styles.projectCard,
                  isActive && styles.projectCardActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={styles.projectHead}>
                  <Text style={styles.projectTitle}>{p.title}</Text>
                  <View style={styles.projectHeadRight}>
                    {/* Star marks the founder's currently-focused
                        project. Browse / Search rank against this. */}
                    {role === "founder" && (
                      <Pressable
                        onPress={handleStar}
                        hitSlop={10}
                        style={({ pressed }) => [
                          styles.starBtn,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Star
                          size={16}
                          color={isActive ? theme.gold : theme.textDim}
                          fill={isActive ? theme.gold : "transparent"}
                        />
                      </Pressable>
                    )}
                    <View
                      style={[
                        styles.publishedPill,
                        p.isPublished
                          ? styles.publishedOn
                          : styles.publishedOff,
                      ]}
                    >
                      <Text
                        style={[
                          styles.publishedPillText,
                          p.isPublished
                            ? { color: theme.emerald }
                            : { color: theme.textMuted },
                        ]}
                      >
                        {p.isPublished ? "Public" : "Draft"}
                      </Text>
                    </View>
                  </View>
                </View>
                {p.description ? (
                  <Text style={styles.projectDesc} numberOfLines={2}>
                    {p.description}
                  </Text>
                ) : null}
                <Text style={styles.projectSaved}>
                  {isActive ? "Active project · " : ""}
                  {p.savedPersonIds.length} saved · tap to manage
                </Text>
              </Pressable>
            );
          })
        )}
      </Section>

      {/* Preview your card - shows the user how their card looks
          to the OTHER side. Founder sees their project; builder sees
          their candidate profile. */}
      <Pressable
        onPress={() => router.push("/preview-card" as never)}
        style={({ pressed }) => [
          styles.previewBtn,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Eye size={16} color={theme.gold} />
        <Text style={styles.previewBtnText}>Preview your card</Text>
      </Pressable>

      <View style={styles.bottomRow}>
        <Pressable
          style={({ pressed }) => [
            styles.bottomBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={async () => {
            await resetTutorial();
            triggerTutorialReplay();
            router.push("/(tabs)" as never);
          }}
        >
          <BookOpen size={16} color={theme.gold} />
          <Text style={styles.tutorialText}>Tutorial</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.bottomBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => router.push("/settings" as never)}
        >
          <SettingsIcon size={16} color={theme.textMuted} />
          <Text style={styles.settingsText}>Settings</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.bottomBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => confirmSignOut(signOut)}
        >
          <LogOut size={16} color={theme.destructive} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      {/* Dark / Light mode toggle — full-width below the three buttons. */}
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          styles.modeBtn,
          pressed && { opacity: 0.7 },
        ]}
      >
        {mode === "light" ? (
          <Moon size={16} color={theme.gold} />
        ) : (
          <Sun size={16} color={theme.gold} />
        )}
        <Text style={styles.modeText}>
          {mode === "light" ? "Dark mode" : "Light mode"}
        </Text>
      </Pressable>
    </Screen>
  );
}

const StatusPill = ({ status }: { status: ReviewStatus }) => {
  const { theme } = useTheme();
  const config = {
    draft: {
      label: "Draft",
      color: theme.textMuted,
      bg: theme.bgElev,
      border: theme.border,
      Icon: Clock,
    },
    pending: {
      label: "Under review",
      color: theme.gold,
      bg: theme.goldGlow,
      border: theme.goldSoft,
      Icon: Clock,
    },
    accepted: {
      label: "Accepted",
      color: theme.emerald,
      bg: "rgba(52,211,153,0.1)",
      border: "rgba(52,211,153,0.4)",
      Icon: CheckCircle2,
    },
    rejected: {
      label: "Rejected",
      color: theme.destructive,
      bg: "rgba(239,68,68,0.1)",
      border: "rgba(239,68,68,0.4)",
      Icon: XCircle,
    },
  }[status];
  const Icon = config.Icon;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: config.border,
        backgroundColor: config.bg,
        borderRadius: 2,
        marginBottom: 8,
      }}
    >
      <Icon size={11} color={config.color} />
      <Text
        style={{
          color: config.color,
          fontFamily: fonts.mono,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 1.5,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
};

const Section = ({
  title,
  children,
  onEdit,
  editLabel = "Edit",
}: {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  editLabel?: string;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
  <View style={styles.section}>
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onEdit ? (
        <Pressable
          onPress={onEdit}
          hitSlop={8}
          style={({ pressed }) => [
            styles.editBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Pencil size={11} color={theme.gold} />
          <Text style={styles.editText}>{editLabel}</Text>
        </Pressable>
      ) : null}
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
  );
};

const Row = ({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[styles.rowValue, good ? { color: theme.emerald } : null]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
};

// Inline toggle row for Open to work — lives on the candidate
// profile section so the user can flip it without entering Edit
// mode. Always-visible description spells out what the switch
// does + surfaces the current gate (locked / missing fields) or
// state ("Visible to founders").
const OpenToWorkRow = ({
  value,
  isAccepted,
  profileComplete,
  missing,
  busy,
  onToggle,
}: {
  value: boolean;
  isAccepted: boolean;
  profileComplete: boolean;
  missing: string[];
  busy: boolean;
  onToggle: (next: boolean) => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const statusLine = !isAccepted
    ? "Locked until your profile is reviewed and accepted."
    : !profileComplete
      ? `Finish first: ${missing.join(", ")}.`
      : value
        ? "Currently on — visible to founders running Find People."
        : "Currently off — hidden from match results.";
  return (
    <View style={styles.openRow}>
      <View style={styles.openHeaderRow}>
        <Text style={styles.openLabel}>Open to work</Text>
        <Switch
          value={value}
          onValueChange={onToggle}
          disabled={busy}
          trackColor={{ false: theme.border, true: theme.gold }}
          thumbColor={theme.bg}
          // Bumps the touch target ~30% so the switch reads as
          // primary, not a label afterthought.
          style={{ transform: [{ scaleX: 1.15 }, { scaleY: 1.15 }] }}
        />
      </View>
      <Text style={styles.openHint}>
        When on, founders running Find People can match with you
        and send chat requests. When off, your profile is hidden
        from match results.
      </Text>
      <Text style={styles.openStatus}>{statusLine}</Text>
    </View>
  );
};

const makeStyles = (theme: ThemePalette) => StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    marginBottom: 16,
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
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  email: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 12,
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: theme.gold,
    backgroundColor: theme.goldGlow,
    borderRadius: 999,
    marginBottom: 20,
  },
  roleBadgeText: {
    color: theme.gold,
    fontFamily: fonts.display,
    fontSize: 13,
    fontWeight: "700",
  },
  roleBadgeHint: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bgElev,
    borderRadius: 4,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
  },
  avatarFallback: {
    width: 56,
    height: 56,
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
    fontSize: 20,
  },
  headline: {
    color: theme.text,
    fontSize: 13,
    lineHeight: 18,
  },
  headlineMuted: {
    color: theme.textDim,
    fontSize: 13,
    fontStyle: "italic",
  },
  rejectCard: {
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
    backgroundColor: "rgba(239,68,68,0.05)",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  rejectLabel: {
    color: theme.destructive,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  rejectBody: { color: theme.text, fontSize: 13, lineHeight: 18 },
  section: { marginBottom: 22 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    color: theme.gold,
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    borderRadius: 2,
  },
  editText: {
    color: theme.gold,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  sectionBody: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.bgElev,
    borderRadius: 4,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
    gap: 12,
  },
  rowLabel: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    flexShrink: 0,
  },
  rowValue: {
    color: theme.text,
    fontSize: 13,
    flex: 1,
    textAlign: "right",
  },
  // Wrapper card for the pinned-at-top Open-to-work toggle. Sits
  // above the avatar / status block so it's the first interactive
  // element on the screen.
  openCard: {
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  // Open-to-work toggle row. Has its own block-level layout (not
  // the inline Row shape) so the description + status can sit
  // under the switch on their own lines.
  openRow: {
    paddingVertical: 4,
  },
  openHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  openLabel: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  openHint: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  openStatus: {
    color: theme.textDim,
    fontSize: 11,
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
  },
  bio: {
    color: theme.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  dim: { color: theme.textMuted, fontSize: 13, lineHeight: 19 },
  // First-run onboarding card. Replaces the dim "use the web app"
  // text that used to live here. Bold, tappable, makes the next
  // action obvious for a founder who just signed up.
  onboardCard: {
    gap: 10,
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
  },
  onboardTitle: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  onboardBody: {
    color: theme.textMuted,
    fontSize: 13.5,
    lineHeight: 19,
  },
  onboardCta: {
    alignSelf: "flex-start",
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: theme.gold,
  },
  onboardCtaText: {
    color: theme.textOnPrimary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  projectCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 8,
  },
  projectCardActive: {
    borderColor: theme.gold,
    backgroundColor: theme.goldGlow,
  },
  projectHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  projectHeadRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  projectTitle: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 17,
    flex: 1,
  },
  publishedPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 2,
  },
  publishedOn: {
    borderColor: "rgba(52,211,153,0.4)",
    backgroundColor: "rgba(52,211,153,0.1)",
  },
  publishedOff: {
    borderColor: theme.border,
    backgroundColor: theme.bgElev,
  },
  publishedPillText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  projectDesc: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 4,
  },
  projectSaved: {
    color: theme.textDim,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  bottomRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    paddingVertical: 12,
  },
  settingsText: { color: theme.textMuted, fontSize: 14, fontWeight: "500" },
  signOutText: { color: theme.destructive, fontSize: 14, fontWeight: "500" },
  tutorialText: { color: theme.gold, fontSize: 14, fontWeight: "500" },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    borderRadius: 4,
    paddingVertical: 14,
    marginBottom: 10,
  },
  previewBtnText: {
    color: theme.gold,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  // Dark / Light mode toggle — full width, sits below the three-button row.
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    borderWidth: 1,
    borderColor: theme.gold,
    backgroundColor: theme.bgElev,
    borderRadius: 4,
    paddingVertical: 14,
    marginTop: 10,
  },
  modeText: {
    color: theme.gold,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
