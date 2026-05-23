/**
 * Preview your card. Reached from MyNet via "Preview your card".
 * Renders a faithful simulation of how the user's card appears to
 * the OTHER side - founders see what partners see in Browse / the
 * Match swipe deck; partners see what founders see in Match.
 *
 * No mutation, no API writes. Pulls from the user's profile + their
 * active project (founders) or candidate fields (partners) and
 * renders the shared card styles inline.
 */
import { useEffect, useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Sparkles,
  User,
} from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import {
  emptyProfile,
  type Profile,
  type Project,
} from "@/lib/types";
import { getAvatarUrl, getProfile, listProjects } from "@/lib/api";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { readMetadataRole } from "@/lib/userRole";
import { MothEmptyState } from "@/components/MothEmptyState";

export default function PreviewCardScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile>(emptyProfile());
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getProfile(user.id), listProjects(user.id)])
      .then(([p, projects]) => {
        if (cancelled) return;
        setProfile(p);
        const active = p.activeProjectId
          ? projects.find((pr) => pr.id === p.activeProjectId)
          : projects[0];
        setActiveProject(active ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const role = readMetadataRole(user) ?? "partner";
  const avatarUrl = getAvatarUrl(profile.avatarPath);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Preview your card</Text>
          <View style={{ width: 20 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.eyebrow}>
            <Sparkles size={12} color={theme.gold} />
            <Text style={styles.eyebrowText}>
              {role === "founder" ? "How partners see you" : "How founders see you"}
            </Text>
          </View>
          <Text style={styles.h1}>This is your card.</Text>
          <Text style={styles.sub}>
            {role === "founder"
              ? "Partners see this in Browse and the Match deck. Update it from Edit MyNet if anything looks off."
              : "Founders see this in Match. Update it from Edit candidate profile if anything looks off."}
          </Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.gold} />
            </View>
          ) : role === "founder" ? (
            <FounderPreview
              project={activeProject}
              profile={profile}
              avatarUrl={avatarUrl}
              styles={styles}
              theme={theme}
            />
          ) : (
            <PartnerPreview
              profile={profile}
              avatarUrl={avatarUrl}
              styles={styles}
              theme={theme}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const FounderPreview = ({
  project,
  profile,
  avatarUrl,
  styles,
  theme,
}: {
  project: Project | null;
  profile: Profile;
  avatarUrl: string | null;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
}) => {
  if (!project) {
    return (
      <MothEmptyState
        variant="blank"
        title="No project yet."
        sub="Create a project to preview how it'll appear to partners."
      />
    );
  }
  return (
    <View style={styles.card}>
      <Text style={styles.projectTitle}>{project.title}</Text>

      <View style={styles.founderRow}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.founderAvatar} />
        ) : (
          <View style={styles.founderAvatarFallback}>
            <Text style={styles.founderInitials}>
              {(profile.fullName[0] ?? "?").toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.founderName} numberOfLines={1}>
            by {profile.fullName || "You"}
          </Text>
          {profile.candidate.headline ? (
            <Text style={styles.founderHeadline} numberOfLines={1}>
              {profile.candidate.headline}
            </Text>
          ) : null}
        </View>
      </View>

      {project.description ? (
        <Text style={styles.cardDesc}>{project.description}</Text>
      ) : (
        <Text style={styles.placeholder}>
          Add a description so partners know what you're working on.
        </Text>
      )}

      {(project.businessType ||
        project.criteria.commitment ||
        project.criteria.location) && (
        <View style={styles.metaRow}>
          {project.businessType ? (
            <View
              style={[
                styles.metaChip,
                { backgroundColor: theme.goldGlow, borderColor: theme.goldSoft },
              ]}
            >
              <Text style={[styles.metaText, { color: theme.gold }]}>
                {project.businessType}
              </Text>
            </View>
          ) : null}
          {project.criteria.commitment ? (
            <View style={styles.metaChip}>
              <Briefcase size={10} color={theme.gold} />
              <Text style={styles.metaText}>{project.criteria.commitment}</Text>
            </View>
          ) : null}
          {project.criteria.location ? (
            <View style={styles.metaChip}>
              <MapPin size={10} color={theme.gold} />
              <Text style={styles.metaText}>{project.criteria.location}</Text>
            </View>
          ) : null}
        </View>
      )}

      {project.criteria.skills.length > 0 ? (
        <View style={styles.skillRow}>
          {project.criteria.skills.map((s) => (
            <View key={s} style={styles.skillChip}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.placeholder}>
          Add skills you need so partners match the right project.
        </Text>
      )}
    </View>
  );
};

const PartnerPreview = ({
  profile,
  avatarUrl,
  styles,
  theme,
}: {
  profile: Profile;
  avatarUrl: string | null;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
}) => {
  const c = profile.candidate;
  return (
    <View style={styles.card}>
      <View style={styles.partnerHeader}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.partnerAvatar} />
        ) : (
          <View style={styles.partnerAvatarFallback}>
            <User size={28} color={theme.textDim} strokeWidth={1.5} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.partnerName}>
            {profile.fullName || "Add your name"}
          </Text>
          {c.headline ? (
            <Text style={styles.partnerHeadline}>{c.headline}</Text>
          ) : (
            <Text style={styles.placeholder}>Add a headline.</Text>
          )}
        </View>
      </View>

      {c.bio ? (
        <Text style={styles.cardDesc}>{c.bio}</Text>
      ) : (
        <Text style={styles.placeholder}>Add a short bio.</Text>
      )}

      {(c.commitment || c.location) && (
        <View style={styles.metaRow}>
          {c.commitment ? (
            <View style={styles.metaChip}>
              <Briefcase size={10} color={theme.gold} />
              <Text style={styles.metaText}>{c.commitment}</Text>
            </View>
          ) : null}
          {c.location ? (
            <View style={styles.metaChip}>
              <MapPin size={10} color={theme.gold} />
              <Text style={styles.metaText}>{c.location}</Text>
            </View>
          ) : null}
        </View>
      )}

      {c.skills.length > 0 ? (
        <View style={styles.skillRow}>
          {c.skills.map((s) => (
            <View key={s} style={styles.skillChip}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.placeholder}>Add at least one skill.</Text>
      )}
    </View>
  );
};

const makeStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    center: { padding: 40, alignItems: "center" },
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
      fontSize: 17,
    },
    body: { padding: 20, paddingBottom: 80 },
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
      fontFamily: fonts.display,
      fontSize: 30,
      letterSpacing: -0.5,
      marginBottom: 6,
    },
    sub: {
      color: theme.textMuted,
      fontSize: 13.5,
      lineHeight: 19,
      marginBottom: 22,
    },
    empty: {
      paddingVertical: 40,
      alignItems: "center",
      gap: 8,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    emptyBody: {
      color: theme.textMuted,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 18,
      maxWidth: 260,
    },
    card: {
      backgroundColor: theme.bgElev,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 18,
      gap: 12,
    },
    projectTitle: {
      color: theme.text,
      fontFamily: fonts.display,
      fontSize: 22,
      lineHeight: 26,
      letterSpacing: -0.3,
    },
    founderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
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
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
    },
    placeholder: {
      color: theme.textDim,
      fontSize: 13,
      fontStyle: "italic",
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 999,
    },
    metaText: {
      color: theme.textMuted,
      fontFamily: fonts.mono,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    skillRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
    },
    skillChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: theme.goldSoft,
      backgroundColor: theme.goldGlow,
      borderRadius: 999,
    },
    skillText: { color: theme.gold, fontSize: 11, fontWeight: "600" },
    partnerHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    partnerAvatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.goldSoft,
    },
    partnerAvatarFallback: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.goldSoft,
      backgroundColor: theme.goldGlow,
      alignItems: "center",
      justifyContent: "center",
    },
    partnerName: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    partnerHeadline: {
      color: theme.textMuted,
      fontSize: 13,
      marginTop: 2,
    },
  });
