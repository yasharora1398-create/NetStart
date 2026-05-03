import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CheckCircle2,
  Clock,
  LogOut,
  Pencil,
  Settings as SettingsIcon,
  Sparkles,
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
import { getAvatarUrl, getProfile, listProjects } from "@/lib/api";
import { fonts, theme } from "@/lib/theme";

export default function MyNetScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(emptyProfile());
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <Screen>
      <View style={styles.eyebrow}>
        <Sparkles size={12} color={theme.gold} />
        <Text style={styles.eyebrowText}>MyNet</Text>
      </View>
      <Text style={styles.h1}>{name}</Text>
      {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}

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

      {/* Credentials block */}
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
        <Row
          label="Resume"
          value={profile.resume ? profile.resume.name : "Not uploaded"}
        />
      </Section>

      {/* Candidate block */}
      <Section
        title="Candidate profile"
        onEdit={() => router.push("/edit-candidate" as never)}
      >
        <Row
          label="Open to work"
          value={profile.candidate.isOpenToWork ? "Yes" : "Off"}
          good={profile.candidate.isOpenToWork}
        />
        <Row label="Headline" value={profile.candidate.headline || "—"} />
        <Row label="Location" value={profile.candidate.location || "—"} />
        <Row label="Commitment" value={profile.candidate.commitment || "—"} />
        <Row
          label="Skills"
          value={
            profile.candidate.skills.length > 0
              ? profile.candidate.skills.join(", ")
              : "—"
          }
        />
        {profile.candidate.bio ? (
          <Text style={styles.bio}>{profile.candidate.bio}</Text>
        ) : null}
      </Section>

      {/* Projects */}
      <Section
        title={`Projects (${projects.length})`}
        onEdit={() => router.push("/edit-project" as never)}
        editLabel="+ New"
      >
        {projects.length === 0 ? (
          <Text style={styles.dim}>
            You haven't created a project yet. Use the web app to set one up.
          </Text>
        ) : (
          projects.map((p) => (
            <Pressable
              key={p.id}
              onPress={() =>
                router.push(`/project/${p.id}` as never)
              }
              style={({ pressed }) => [
                styles.projectCard,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.projectHead}>
                <Text style={styles.projectTitle}>{p.title}</Text>
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
              {p.description ? (
                <Text style={styles.projectDesc} numberOfLines={2}>
                  {p.description}
                </Text>
              ) : null}
              <Text style={styles.projectSaved}>
                {p.savedPersonIds.length} saved · tap to manage
              </Text>
            </Pressable>
          ))
        )}
      </Section>

      <View style={styles.bottomRow}>
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
          onPress={() => signOut()}
        >
          <LogOut size={16} color={theme.destructive} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const StatusPill = ({ status }: { status: ReviewStatus }) => {
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
}) => (
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

const Row = ({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean;
}) => (
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

const styles = StyleSheet.create({
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
    marginBottom: 20,
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
  projectCard: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  projectHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
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
});
