/**
 * Builder-side Match: swipe through published projects. Mirrors the
 * founder Match screen (`(tabs)/index.tsx`) but with project cards
 * instead of candidates.
 *
 *   - Top-right has the same two icons as the founder side: Undo
 *     (rolls back the last decision) and Search (jumps to /search).
 *   - One card at a time. Swipe right to save (bookmarks the
 *     project), swipe left to pass.
 *   - SAVE / PASS overlays fade in as the card travels.
 *   - Bottom action buttons mirror the swipe so the user can tap
 *     instead of swipe.
 *
 * Founders never see this screen — the (tabs) layout hides it from
 * their tab bar, and the effect below redirects any direct nav
 * back to the Match deck.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Bookmark,
  Briefcase,
  MapPin,
  Search,
  Sparkles,
  Undo2,
  X,
} from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import {
  getAvatarUrl,
  listPublishedProjects,
} from "@/lib/api";
import {
  addSavedProject,
  removeSavedProject,
} from "@/lib/savedProjects";
import type { PublicProject } from "@/lib/types";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { MothEmptyState } from "@/components/MothEmptyState";
import { MothLoader } from "@/components/MothLoader";

const { width: SCREEN_W } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_W * 0.28;

export default function BrowseScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  // Track the last decision so the Undo button can roll back.
  const [lastSwipe, setLastSwipe] = useState<{
    project: PublicProject;
    status: "saved" | "passed";
  } | null>(null);

  // Founders shouldn't be on this screen — bounce them to their
  // own Match deck if they end up here via stale router state.
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
        if (cancelled) return;
        // Filter out projects the current user owns; they
        // shouldn't see their own listing in the deck.
        const visible = user?.id
          ? list.filter((p) => p.ownerId !== user.id)
          : list;
        setProjects(visible);
      })
      .catch(() => {
        if (!cancelled) setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const current = projects[index] ?? null;
  const next = projects[index + 1] ?? null;
  const remaining = projects.length - index;

  const decide = (dir: "left" | "right") => {
    if (!current) return;
    if (dir === "right") {
      addSavedProject(current);
      setLastSwipe({ project: current, status: "saved" });
    } else {
      setLastSwipe({ project: current, status: "passed" });
    }
    setIndex((i) => i + 1);
  };

  const handleUndo = () => {
    if (!lastSwipe) return;
    const { project, status } = lastSwipe;
    if (status === "saved") removeSavedProject(project.id);
    setLastSwipe(null);
    setIndex((i) => Math.max(0, i - 1));
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.eyebrow}>
            <Sparkles size={12} color={theme.gold} />
            <Text style={styles.eyebrowText}>Match</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Undo — rolls the deck back one card. */}
            <Pressable
              onPress={handleUndo}
              disabled={!lastSwipe}
              hitSlop={12}
              style={({ pressed }) => [
                styles.iconBtn,
                !lastSwipe && { opacity: 0.35 },
                pressed && lastSwipe && { opacity: 0.7 },
              ]}
            >
              <Undo2 size={18} color={theme.gold} />
            </Pressable>
            {/* Search — opens the filter page. */}
            <Pressable
              onPress={() => router.push("/search" as never)}
              hitSlop={12}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Search size={18} color={theme.gold} />
            </Pressable>
          </View>
        </View>
        <Text style={styles.h1}>Open projects.</Text>
      </View>

      <View style={styles.deck}>
        {loading ? (
          <View style={styles.center}>
            <MothLoader size={160} />
          </View>
        ) : !current ? (
          <MothEmptyState
            variant="platform"
            title="Nothing here yet."
            sub="Check back soon. Founders are spinning things up."
          />
        ) : (
          <View style={styles.deckInner}>
            {next ? (
              <ProjectCard project={next} stacked styles={styles} theme={theme} />
            ) : null}
            <SwipeCard
              key={current.id + index}
              project={current}
              onDecide={decide}
              styles={styles}
              theme={theme}
            />
          </View>
        )}
      </View>

      {/* Bottom action row — same affordances as a swipe so users
          who don't realize the card is draggable can still decide.
          Sits just above the floating tab bar; the deck area above
          absorbs whatever vertical room is left. */}
      {remaining > 0 && (
        <View style={styles.actions}>
          <Pressable
            onPress={() => decide("left")}
            style={({ pressed }) => [
              styles.actionBtn,
              { borderColor: theme.border, backgroundColor: theme.bgElev },
              pressed && { opacity: 0.85 },
            ]}
          >
            <X size={22} color={theme.destructive} />
          </Pressable>
          <Pressable
            onPress={() => decide("right")}
            style={({ pressed }) => [
              styles.actionBtn,
              { borderColor: theme.gold, backgroundColor: theme.gold },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Bookmark size={22} color={theme.bg} />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

// Project card content — used both as the swipe top card and as
// the stacked under-card preview. `stacked` styles it slightly
// smaller and offset so it reads as the next-in-deck.
const ProjectCard = ({
  project,
  stacked = false,
  styles,
  theme,
}: {
  project: PublicProject;
  stacked?: boolean;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
}) => {
  const founderUrl = getAvatarUrl(project.founderAvatarPath);
  return (
    <View
      style={[
        styles.card,
        stacked && {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ scale: 0.96 }],
          opacity: 0.55,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        {founderUrl ? (
          <Image source={{ uri: founderUrl }} style={styles.founderAvatar} />
        ) : (
          <View style={styles.founderAvatarFallback}>
            <Text style={styles.founderInitials}>
              {(project.founderFullName[0] ?? "?").toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.cardFounder} numberOfLines={1}>
            {project.founderFullName || "Anonymous"}
          </Text>
          {project.founderHeadline ? (
            <Text style={styles.cardHeadline} numberOfLines={1}>
              {project.founderHeadline}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.cardTitle}>{project.title}</Text>

      {project.description ? (
        <Text style={styles.cardDesc} numberOfLines={6}>
          {project.description}
        </Text>
      ) : null}

      {(project.businessType ||
        project.criteria.commitment ||
        project.criteria.location) && (
        <View style={styles.metaRow}>
          {project.businessType ? (
            <View
              style={[
                styles.metaChip,
                {
                  backgroundColor: theme.goldGlow,
                  borderColor: theme.goldSoft,
                },
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

      {project.criteria.skills.length > 0 && (
        <View style={styles.skillRow}>
          {project.criteria.skills.slice(0, 6).map((s) => (
            <View key={s} style={styles.skillChip}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const SwipeCard = ({
  project,
  onDecide,
  styles,
  theme,
}: {
  project: PublicProject;
  onDecide: (dir: "left" | "right") => void;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
}) => {
  const x = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      x.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        x.value = withTiming(SCREEN_W * 1.4, { duration: 220 });
        runOnJS(onDecide)("right");
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        x.value = withTiming(-SCREEN_W * 1.4, { duration: 220 });
        runOnJS(onDecide)("left");
      } else {
        x.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      {
        rotate: `${interpolate(
          x.value,
          [-SCREEN_W, 0, SCREEN_W],
          [-12, 0, 12],
          Extrapolation.CLAMP,
        )}deg`,
      },
    ],
  }));

  const saveBadge = useAnimatedStyle(() => ({
    opacity: interpolate(
      x.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const passBadge = useAnimatedStyle(() => ({
    opacity: interpolate(
      x.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.cardAbsolute, cardStyle]}>
        <ProjectCard project={project} styles={styles} theme={theme} />
        <Animated.View
          style={[styles.swipeBadge, styles.saveBadge, saveBadge]}
        >
          <Text style={styles.swipeBadgeText}>SAVE</Text>
        </Animated.View>
        <Animated.View
          style={[styles.swipeBadge, styles.passBadge, passBadge]}
        >
          <Text style={styles.swipeBadgeText}>PASS</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const makeStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    header: { padding: 20, paddingTop: 12, paddingBottom: 8 },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    iconBtn: {
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
      letterSpacing: -0.5,
    },
    deck: { flex: 1, padding: 20, paddingTop: 8 },
    deckInner: { flex: 1, position: "relative" },
    cardAbsolute: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    card: {
      flex: 1,
      backgroundColor: theme.bgElev,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      padding: 22,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 18,
    },
    founderAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.goldSoft,
    },
    founderAvatarFallback: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.goldSoft,
      backgroundColor: theme.goldGlow,
      alignItems: "center",
      justifyContent: "center",
    },
    founderInitials: {
      color: theme.gold,
      fontFamily: fonts.display,
      fontSize: 19,
    },
    cardFounder: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
    },
    cardHeadline: {
      color: theme.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    cardTitle: {
      color: theme.text,
      fontFamily: fonts.display,
      fontSize: 26,
      lineHeight: 30,
      marginBottom: 12,
      letterSpacing: -0.3,
    },
    cardDesc: {
      color: theme.textMuted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 14,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 12,
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
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
    skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
    skillChip: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: theme.goldSoft,
      backgroundColor: theme.goldGlow,
      borderRadius: 2,
    },
    skillText: { color: theme.text, fontSize: 11 },
    swipeBadge: {
      position: "absolute",
      top: 30,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 3,
      borderRadius: 6,
    },
    saveBadge: {
      left: 20,
      borderColor: theme.gold,
      transform: [{ rotate: "-12deg" }],
    },
    passBadge: {
      right: 20,
      borderColor: theme.destructive,
      transform: [{ rotate: "12deg" }],
    },
    swipeBadgeText: {
      color: theme.text,
      fontFamily: fonts.mono,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: 2,
    },
    actions: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 120,
      flexDirection: "row",
      justifyContent: "center",
      gap: 18,
    },
    actionBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
  });
