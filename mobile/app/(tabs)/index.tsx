import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  ChevronDown,
  Heart,
  MapPin,
  Sparkles,
  X,
} from "lucide-react-native";
import { useAuth } from "@/lib/auth";
import {
  getAvatarUrl,
  listProjects,
  matchCandidatesForProject,
  setPersonStatus,
} from "@/lib/api";
import type { Candidate, Project } from "@/lib/types";
import { fonts, theme } from "@/lib/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_W * 0.28;

type RankedCandidate = Candidate & { similarity: number };

export default function MatchScreen() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);

  // Load owned projects (user must own at least one to run Match).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    listProjects(user.id)
      .then((list) => {
        if (cancelled) return;
        setProjects(list);
        setActiveProject(list[0] ?? null);
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
  }, [user]);

  // Load matches whenever the active project changes.
  useEffect(() => {
    if (!activeProject) {
      setCandidates([]);
      setIndex(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    matchCandidatesForProject(activeProject.id)
      .then((list) => {
        if (cancelled) return;
        // Filter out already-saved or already-passed.
        const saved = new Set(activeProject.savedPersonIds);
        const passed = new Set(activeProject.passedPersonIds);
        setCandidates(
          list.filter((c) => !saved.has(c.userId) && !passed.has(c.userId)),
        );
        setIndex(0);
      })
      .catch(() => {
        if (!cancelled) setCandidates([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeProject]);

  const remaining = candidates.length - index;
  const current = candidates[index];
  const next = candidates[index + 1];

  const decide = async (direction: "left" | "right") => {
    if (!activeProject || !current) return;
    const status = direction === "right" ? "saved" : "passed";
    setIndex((i) => i + 1);
    try {
      await setPersonStatus(activeProject.id, current.userId, status);
    } catch {
      // silent — user can re-decide on the web side
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.eyebrow}>
          <Sparkles size={12} color={theme.gold} />
          <Text style={styles.eyebrowText}>Match</Text>
        </View>
        <Text style={styles.h1}>For you.</Text>

        {projects.length > 0 && (
          <>
            <Pressable
              onPress={() => setPicker((p) => !p)}
              style={({ pressed }) => [
                styles.pickerBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerLabel}>Matching against</Text>
                <Text style={styles.pickerValue} numberOfLines={1}>
                  {activeProject?.title ?? "Pick a project"}
                </Text>
              </View>
              <ChevronDown size={16} color={theme.textMuted} />
            </Pressable>

            {picker && (
              <View style={styles.pickerList}>
                {projects.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      setActiveProject(p);
                      setPicker(false);
                    }}
                    style={({ pressed }) => [
                      styles.pickerItem,
                      pressed && { backgroundColor: theme.bgElev },
                      activeProject?.id === p.id && {
                        backgroundColor: theme.goldGlow,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        activeProject?.id === p.id && { color: theme.gold },
                      ]}
                      numberOfLines={1}
                    >
                      {p.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      {/* Deck */}
      <View style={styles.deck}>
        {loading && projects.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.gold} />
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.empty}>
            <Sparkles size={20} color={theme.gold} />
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptyBody}>
              Create a project on the web to unlock matching. Match ranks
              operators against your project's criteria.
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.gold} />
          </View>
        ) : remaining === 0 ? (
          <View style={styles.empty}>
            <Heart size={20} color={theme.gold} />
            <Text style={styles.emptyTitle}>You're caught up</Text>
            <Text style={styles.emptyBody}>
              No more candidates ranked against this project. Lower the
              criteria or wait for new operators to join.
            </Text>
          </View>
        ) : (
          <View style={styles.deckInner}>
            {next && <CandidateCard candidate={next} stacked />}
            <SwipeCard
              key={current!.userId + index}
              candidate={current!}
              onDecide={decide}
            />
          </View>
        )}
      </View>

      {/* Action buttons */}
      {remaining > 0 && projects.length > 0 && (
        <View style={styles.actions}>
          <Pressable
            onPress={() => decide("left")}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionPass,
              pressed && { opacity: 0.85 },
            ]}
          >
            <X size={22} color={theme.destructive} />
          </Pressable>
          <Pressable
            onPress={() => decide("right")}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.actionSave,
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

const SwipeCard = ({
  candidate,
  onDecide,
}: {
  candidate: RankedCandidate;
  onDecide: (dir: "left" | "right") => void;
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
        <CandidateCard candidate={candidate} />
        <Animated.View style={[styles.swipeBadge, styles.saveBadge, saveBadge]}>
          <Text style={styles.swipeBadgeText}>SAVE</Text>
        </Animated.View>
        <Animated.View style={[styles.swipeBadge, styles.passBadge, passBadge]}>
          <Text style={styles.swipeBadgeText}>PASS</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const CandidateCard = ({
  candidate,
  stacked = false,
}: {
  candidate: RankedCandidate;
  stacked?: boolean;
}) => {
  const url = getAvatarUrl(candidate.avatarPath);
  const score = Math.round((candidate.similarity || 0) * 100);
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
          transform: [{ scale: 0.96 }, { translateY: 14 }],
          opacity: 0.55,
        },
      ]}
      pointerEvents={stacked ? "none" : "auto"}
    >
      <View style={styles.cardHeader}>
        {url ? (
          <Image source={{ uri: url }} style={styles.cardAvatar} />
        ) : (
          <View style={styles.cardAvatarFallback}>
            <Text style={styles.cardAvatarInitials}>
              {(candidate.fullName[0] ?? "?").toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>
            {candidate.fullName || "Unnamed"}
          </Text>
          {candidate.headline ? (
            <Text style={styles.cardHeadline} numberOfLines={2}>
              {candidate.headline}
            </Text>
          ) : null}
        </View>
        <View style={styles.matchPill}>
          <Text style={styles.matchPillText}>{score}%</Text>
        </View>
      </View>

      {candidate.bio ? (
        <Text style={styles.cardBio} numberOfLines={6}>
          {candidate.bio}
        </Text>
      ) : null}

      {(candidate.location || candidate.commitment) && (
        <View style={styles.metaRow}>
          {candidate.commitment ? (
            <Text style={styles.meta}>
              <Sparkles size={10} color={theme.gold} />{" "}
              {candidate.commitment}
            </Text>
          ) : null}
          {candidate.location ? (
            <View style={styles.metaInline}>
              <MapPin size={10} color={theme.gold} />
              <Text style={styles.meta}>{candidate.location}</Text>
            </View>
          ) : null}
        </View>
      )}

      {candidate.skills.length > 0 && (
        <View style={styles.skillRow}>
          {candidate.skills.slice(0, 8).map((s) => (
            <View key={s} style={styles.skillChip}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
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
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
  },
  pickerLabel: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  pickerValue: { color: theme.text, fontSize: 14 },
  pickerList: {
    marginTop: 6,
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  pickerItemText: { color: theme.text, fontSize: 13 },
  deck: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 96 },
  deckInner: { flex: 1, position: "relative" },
  empty: { alignItems: "center", padding: 40, justifyContent: "center", flex: 1 },
  emptyTitle: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 22,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyBody: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 320,
  },
  cardAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    flex: 1,
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    borderRadius: 6,
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  cardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
  },
  cardAvatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarInitials: {
    color: theme.gold,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  cardName: { color: theme.text, fontFamily: fonts.display, fontSize: 22 },
  cardHeadline: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  matchPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    borderRadius: 2,
  },
  matchPillText: {
    color: theme.gold,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  cardBio: {
    color: theme.text,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  metaInline: { flexDirection: "row", alignItems: "center", gap: 4 },
  meta: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  skillChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    borderRadius: 2,
  },
  skillText: { color: theme.text, fontSize: 10 },
  swipeBadge: {
    position: "absolute",
    top: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderRadius: 4,
  },
  saveBadge: {
    right: 22,
    borderColor: theme.gold,
    transform: [{ rotate: "10deg" }],
  },
  passBadge: {
    left: 22,
    borderColor: theme.destructive,
    transform: [{ rotate: "-10deg" }],
  },
  swipeBadgeText: {
    fontFamily: fonts.mono,
    fontSize: 18,
    letterSpacing: 3,
    color: theme.text,
  },
  actions: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 24,
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
  actionPass: {
    borderColor: theme.border,
    backgroundColor: theme.bgElev,
  },
  actionSave: {
    borderColor: theme.gold,
    backgroundColor: theme.gold,
  },
});
