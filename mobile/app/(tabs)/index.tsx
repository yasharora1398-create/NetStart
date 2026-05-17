import { useEffect, useMemo, useState } from "react";
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
  ChevronDown,
  MapPin,
  Search,
  Sparkles,
  Undo2,
  X,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import {
  getAvatarUrl,
  listProjects,
  matchCandidatesForProject,
  removePerson,
  requestChat,
  setPersonStatus,
} from "@/lib/api";
import type { Candidate, Project } from "@/lib/types";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { MothEmptyState } from "@/components/MothEmptyState";
import { MothLoader } from "@/components/MothLoader";
import { CandidateDetail } from "@/components/CandidateDetail";
import { addSentRequest } from "@/lib/sentRequests";

const { width: SCREEN_W } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_W * 0.28;

type RankedCandidate = Candidate & { similarity: number };

export default function MatchScreen() {
  const { user } = useAuth();
  const router = useRouter();
  // Reads the active palette (light/dark) from the global theme
  // store. Without this, the screen was frozen at module-load time
  // using the light-mode static export from "@/lib/theme".
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Builders shouldn't see the candidate swipe deck. The tab bar
  // hides this screen for them, but a stale router state or a
  // direct deep link could still land them here — bounce to Browse.
  const role = user?.user_metadata?.role as string | undefined;
  useEffect(() => {
    if (role === "builder") {
      router.replace("/(tabs)/browse" as never);
    }
  }, [role, router]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState(false);
  // Undo cache for the last swipe. The header button rolls the deck
  // back one card and removes the saved/passed row from Supabase so
  // the candidate reappears on the next reload.
  const [lastSwipe, setLastSwipe] = useState<{
    candidate: RankedCandidate;
    status: "saved" | "passed";
  } | null>(null);
  // Detail-sheet state. Opens on tap or on right-swipe (save), slides
  // up the full candidate info — bio, skills, LinkedIn, resume.
  const [selected, setSelected] = useState<RankedCandidate | null>(null);

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
    setLastSwipe({ candidate: current, status });
    if (direction === "right") {
      // Saving = "I want to learn more about them". Open the detail
      // sheet so the user lands on the builder's full info right
      // after the swipe.
      setSelected(current);
    }
    setIndex((i) => i + 1);
    try {
      await setPersonStatus(activeProject.id, current.userId, status);
    } catch {
      // silent — user can re-decide on the web side
    }
  };

  const handleUndo = async () => {
    if (!activeProject || !lastSwipe) return;
    const { candidate } = lastSwipe;
    setLastSwipe(null);
    setIndex((i) => Math.max(0, i - 1));
    setCandidates((prev) => {
      const exists = prev.some((c) => c.userId === candidate.userId);
      return exists ? prev : [candidate, ...prev];
    });
    try {
      await removePerson(activeProject.id, candidate.userId);
    } catch {
      // silent — DB row may not exist if the previous save failed
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.eyebrow}>
            <Sparkles size={12} color={theme.gold} />
            <Text style={styles.eyebrowText}>Match</Text>
          </View>
          <View style={styles.headerActions}>
            {/* Undo: rolls the deck back one card and clears the
                last save/pass on the server. Only enabled when
                there's a swipe to undo. */}
            <Pressable
              onPress={handleUndo}
              disabled={!lastSwipe}
              hitSlop={12}
              style={({ pressed }) => [
                styles.searchIconBtn,
                !lastSwipe && { opacity: 0.35 },
                pressed && lastSwipe && { opacity: 0.7 },
              ]}
            >
              <Undo2 size={18} color={theme.gold} />
            </Pressable>
            {/* Magnifying glass opens the Search page where filters
                tighten criteria for one specific search. */}
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
            <MothLoader size={180} />
          </View>
        ) : projects.length === 0 ? (
          <MothEmptyState
            variant="blank"
            title="No projects yet."
            sub="Create a project on the web to unlock matching. Match ranks builders against your project's criteria."
          />
        ) : loading ? (
          <View style={styles.center}>
            <MothLoader size={180} />
          </View>
        ) : remaining === 0 ? (
          <MothEmptyState
            variant="caught"
            sub="No more candidates ranked against this project. Lower the criteria or wait for new builders to join."
          />
        ) : (
          <View style={styles.deckInner}>
            {next && (
              <CandidateCard
                candidate={next}
                stacked
                styles={styles}
                theme={theme}
              />
            )}
            <SwipeCard
              key={current!.userId + index}
              candidate={current!}
              onDecide={decide}
              onTap={() => setSelected(current!)}
              styles={styles}
              theme={theme}
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

      {selected && (
        <CandidateDetail
          candidate={selected}
          role="founder"
          onClose={() => setSelected(null)}
          onCtaPress={() => {
            const target = selected;
            addSentRequest(target, "chat");
            if (!target.userId.startsWith("fake-")) {
              requestChat(target.userId, null).catch(() => {
                // Silent — local row still renders.
              });
            }
            setSelected(null);
            router.push(`/chats/${target.userId}?intro=1` as never);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const SwipeCard = ({
  candidate,
  onDecide,
  onTap,
  styles,
  theme,
}: {
  candidate: RankedCandidate;
  onDecide: (dir: "left" | "right") => void;
  onTap: () => void;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
}) => {
  const x = useSharedValue(0);

  // Pan needs ~10px travel before activating, so a clean tap never
  // registers as a pan. Tap races against pan exclusively — first to
  // win cancels the other.
  const pan = Gesture.Pan()
    .minDistance(10)
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

  const tap = Gesture.Tap().onEnd((_e, success) => {
    if (success) runOnJS(onTap)();
  });

  const gesture = Gesture.Exclusive(pan, tap);

  // Card transform + soft colored glow on the edges of the card.
  // Green when swiping right (save), red when swiping left (pass).
  // iOS / web render this as a true colored shadow on the card's
  // silhouette. Android falls back to no glow (elevation shadows
  // can't be tinted).
  const cardStyle = useAnimatedStyle(() => {
    const t = Math.min(Math.abs(x.value) / SWIPE_THRESHOLD, 1);
    const shadowColor =
      x.value > 0.5 ? "#22c55e" : x.value < -0.5 ? "#ef4444" : "transparent";
    return {
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
      shadowColor,
      shadowOpacity: t * 0.85,
      shadowRadius: 20 + t * 8,
      shadowOffset: { width: 0, height: 0 },
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.cardAbsolute, cardStyle]}>
        <CandidateCard candidate={candidate} styles={styles} theme={theme} />
      </Animated.View>
    </GestureDetector>
  );
};

const CandidateCard = ({
  candidate,
  stacked = false,
  styles,
  theme,
}: {
  candidate: RankedCandidate;
  stacked?: boolean;
  styles: ReturnType<typeof makeStyles>;
  theme: ThemePalette;
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
      <View style={styles.hero}>
        {url ? (
          <Image source={{ uri: url }} style={styles.heroImg} />
        ) : (
          <View style={styles.heroFallback}>
            <Text style={styles.heroInitials}>
              {(candidate.fullName[0] ?? "?").toUpperCase()}
            </Text>
          </View>
        )}
        {score > 0 ? (
          <View style={styles.matchPill}>
            <Text style={styles.matchPillText}>{score}%</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {candidate.fullName || "Unnamed"}
        </Text>
        {candidate.headline ? (
          <Text style={styles.cardHeadline} numberOfLines={2}>
            {candidate.headline}
          </Text>
        ) : null}

        {candidate.bio ? (
          <Text style={styles.cardBio} numberOfLines={3}>
            {candidate.bio}
          </Text>
        ) : null}

        {(candidate.location || candidate.commitment) && (
          <View style={styles.metaRow}>
            {candidate.commitment ? (
              <View style={styles.metaInline}>
                <Sparkles size={10} color={theme.gold} />
                <Text style={styles.meta}>{candidate.commitment}</Text>
              </View>
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
            {candidate.skills.slice(0, 6).map((s) => (
              <View key={s} style={styles.skillChip}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const makeStyles = (theme: ThemePalette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
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
  // Shadow donor: matches the inner card's shape so iOS/web can
  // compute the colored swipe glow against a real silhouette. The
  // CandidateCard child fills it and clips its own content.
  cardAbsolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.bgElev,
    borderRadius: 18,
  },
  card: {
    flex: 1,
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    borderRadius: 18,
    overflow: "hidden",
  },
  hero: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: theme.goldGlow,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heroImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  heroInitials: {
    color: theme.gold,
    fontFamily: fonts.display,
    fontSize: 96,
  },
  cardBody: {
    padding: 18,
    gap: 6,
    flexShrink: 1,
  },
  cardName: { color: theme.text, fontFamily: fonts.display, fontSize: 24 },
  cardHeadline: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  matchPill: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.bgElev,
    borderRadius: 4,
  },
  matchPillText: {
    color: theme.gold,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  cardBio: {
    color: theme.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
  },
  metaInline: { flexDirection: "row", alignItems: "center", gap: 4 },
  meta: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  skillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 6,
  },
  skillChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.goldSoft,
    backgroundColor: theme.goldGlow,
    borderRadius: 2,
  },
  skillText: { color: theme.text, fontSize: 10 },
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
