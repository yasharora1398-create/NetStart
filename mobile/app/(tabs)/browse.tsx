/**
 * Partner-side Match: swipe through published projects.
 *
 * - One card per project. Big square founder avatar fills the top
 * of the card; meta + title + pitch live below.
 * - Swipe right to save (bookmark), swipe left to pass. No on-card
 * SAVE / PASS labels - the motion is the affordance.
 * - Tap the card to slide up the detail sheet (CandidateDetail).
 * Shows the founder's full info - bio, skills, LinkedIn, plus the
 * project title / description. Mirrors what /u/<founderId> shows
 * on the web.
 * - Bottom action row still has tap-to-decide buttons.
 *
 * Founders never see this screen - (tabs)/_layout hides it from
 * their tab bar; the redirect below catches stale router state.
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
 User,
 X,
} from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import {
 getAvatarUrl,
 getPublicFounder,
 listPublishedProjects,
 type PublicFounder,
} from "@/lib/api";
import {
 addSavedProject,
 removeSavedProject,
} from "@/lib/savedProjects";
import type { Candidate, PublicProject } from "@/lib/types";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";
import { MothEmptyState } from "@/components/MothEmptyState";
import { MothLoader } from "@/components/MothLoader";
import { CandidateDetail } from "@/components/CandidateDetail";
import { ApplyDialog } from "@/components/ApplyDialog";

const { width: SCREEN_W } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_W * 0.28;

type RankedCandidate = Candidate & {
 similarity: number;
 role?: "founder" | "partner";
 projectTitle?: string;
 projectDescription?: string;
};

// Compose a founder profile + project into the Candidate shape that
// CandidateDetail / ApplyDialog already know how to render.
const founderToCandidate = (
 founder: PublicFounder,
 project: PublicProject,
): RankedCandidate => ({
 userId: founder.userId,
 fullName: founder.fullName,
 linkedinUrl: founder.linkedinUrl,
 headline: founder.headline,
 bio: founder.bio,
 skills: founder.skills,
 location: founder.location,
 commitment: founder.commitment,
 resumeName: null,
 resumePath: null,
 avatarPath: founder.avatarPath,
 similarity: 0,
 role: "founder",
 projectTitle: project.title,
 projectDescription: project.description,
});

export default function BrowseScreen() {
 const { user } = useAuth();
 const router = useRouter();
 const { theme } = useTheme();
 const styles = useMemo(() => makeStyles(theme), [theme]);

 const [projects, setProjects] = useState<PublicProject[]>([]);
 const [index, setIndex] = useState(0);
 const [loading, setLoading] = useState(true);
 const [lastSwipe, setLastSwipe] = useState<{
 project: PublicProject;
 status: "saved" | "passed";
 } | null>(null);

 // Detail-sheet state. `opening` shows a brief spinner-free hold
 // while we fetch the founder's full profile.
 const [selected, setSelected] = useState<RankedCandidate | null>(null);
 const [applyTo, setApplyTo] = useState<RankedCandidate | null>(null);


 // Founders shouldn't be on this screen - bounce them to their
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
 // Filter out projects the current user owns; they shouldn't
 // see their own listing in the deck.
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
 // Saving = "I want to learn more". Open the detail sheet so
 // the user lands on the founder's full info immediately
 // after the swipe.
 void openDetail(current);
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

 // Tap a card → fetch the founder's full profile, then open the
 // detail sheet. We don't block the UI on the fetch; the sheet
 // pops with what we already have and the network result hydrates
 // the rest. Realistically `get_public_founder` returns in <200ms.
 const openDetail = async (project: PublicProject) => {
 // Seed with what we know from the card so the sheet opens fast.
 const seed: RankedCandidate = {
 userId: project.ownerId,
 fullName: project.founderFullName,
 linkedinUrl: "",
 headline: project.founderHeadline,
 bio: "",
 skills: [],
 location: "",
 commitment: "",
 resumeName: null,
 resumePath: null,
 avatarPath: project.founderAvatarPath,
 similarity: 0,
 role: "founder",
 projectTitle: project.title,
 projectDescription: project.description,
 };
 setSelected(seed);
 try {
 const founder = await getPublicFounder(project.ownerId);
 if (founder) setSelected(founderToCandidate(founder, project));
 } catch {
 // Sheet stays open with the seed data.
 }
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
 <>
 <MothEmptyState
 variant={projects.length > 0 ? "caught" : "platform"}
 title={projects.length > 0 ? "You're caught up." : "Nothing here yet."}
 sub={
 projects.length > 0
 ? "You've worked through every project on the deck. Review the ones you've already seen, or wait for new ones to land."
 : "Check back soon. Founders are spinning things up."
 }
 />
 <View style={styles.reviewSeenWrap}>
 <Pressable
 onPress={() => setIndex(0)}
 style={({ pressed }) => [
 styles.reviewSeenBtn,
 pressed && { opacity: 0.85 },
 ]}
 >
 <Undo2 size={16} color={theme.gold} />
 <Text style={styles.reviewSeenText}>
 Review already seen ({projects.length})
 </Text>
 </Pressable>
 </View>
 </>
 ) : (
 <View style={styles.deckInner}>
 {next ? (
 <ProjectCard project={next} stacked styles={styles} theme={theme} />
 ) : null}
 <SwipeCard
 key={current.id + index}
 project={current}
 onDecide={decide}
 onTap={() => openDetail(current)}
 styles={styles}
 theme={theme}
 />
 </View>
 )}
 </View>

 {selected && (
 <CandidateDetail
 candidate={selected}
 role="partner"
 onClose={() => setSelected(null)}
 onCtaPress={() => {
 const target = selected;
 setSelected(null);
 setApplyTo(target);
 }}
 />
 )}

 {applyTo && (
 <ApplyDialog
 candidate={applyTo}
 onClose={() => setApplyTo(null)}
 />
 )}
 </SafeAreaView>
 );
}

// Hero card. Big square founder avatar fills the top; meta + pitch
// stack below. Used both as the active top card and as the stacked
// under-card preview.
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
 pointerEvents={stacked ? "none" : "auto"}
 >
 <View style={styles.hero}>
 {founderUrl ? (
 <Image source={{ uri: founderUrl }} style={styles.heroImg} />
 ) : (
 <View style={styles.heroFallback}>
 <User size={88} color={theme.textDim} strokeWidth={1.4} />
 </View>
 )}
 </View>

 <View style={styles.cardBody}>
 <Text style={styles.cardTitle} numberOfLines={2}>
 {project.title}
 </Text>
 <Text style={styles.cardFounder} numberOfLines={1}>
 by {project.founderFullName || "Anonymous"}
 {project.founderHeadline ? ` · ${project.founderHeadline}` : null}
 </Text>

 {/* Pills: business type + commitment + location + skills,
 all under the name. */}
 {(project.businessType ||
 project.criteria.commitment ||
 project.criteria.location ||
 project.criteria.skills.length > 0) && (
 <View style={styles.pillRow}>
 {project.businessType ? (
 <View style={styles.pillSolid}>
 <Text style={styles.pillSolidText}>
 {project.businessType}
 </Text>
 </View>
 ) : null}
 {project.criteria.commitment ? (
 <View style={styles.pillSolid}>
 <Briefcase size={10} color={theme.bg} />
 <Text style={styles.pillSolidText}>
 {project.criteria.commitment}
 </Text>
 </View>
 ) : null}
 {project.criteria.location ? (
 <View style={styles.pillSolid}>
 <MapPin size={10} color={theme.bg} />
 <Text style={styles.pillSolidText}>
 {project.criteria.location}
 </Text>
 </View>
 ) : null}
 {project.criteria.skills.slice(0, 5).map((s) => (
 <View key={s} style={styles.pillOutline}>
 <Text style={styles.pillOutlineText}>{s}</Text>
 </View>
 ))}
 </View>
 )}

 {project.description ? (
 <Text style={styles.cardDesc} numberOfLines={3}>
 {project.description}
 </Text>
 ) : null}
 </View>
 </View>
 );
};

const SwipeCard = ({
 project,
 onDecide,
 onTap,
 styles,
 theme,
}: {
 project: PublicProject;
 onDecide: (dir: "left" | "right") => void;
 onTap: () => void;
 styles: ReturnType<typeof makeStyles>;
 theme: ThemePalette;
}) => {
 const x = useSharedValue(0);

 // Pan needs ~10px of travel before it activates, so a clean tap
 // never registers as a pan. Tap races against pan: whichever wins
 // first cancels the other.
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

 // Card transform + animated outline. No glow / shadow - just a
 // colored border that swaps to green (right = save) or red
 // (left = pass) and thickens as the drag progresses.
 const cardStyle = useAnimatedStyle(() => {
 const t = Math.min(Math.abs(x.value) / SWIPE_THRESHOLD, 1);
 const borderColor =
 x.value > 0.5
 ? "#22c55e"
 : x.value < -0.5
 ? "#ef4444"
 : theme.goldSoft;
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
 borderWidth: 1 + t * 2,
 borderColor,
 };
 });

 return (
 <GestureDetector gesture={gesture}>
 <Animated.View style={[styles.cardAbsolute, cardStyle]}>
 <ProjectCard project={project} styles={styles} theme={theme} />
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
 deck: { flex: 1, paddingHorizontal: 20, paddingTop: 0, paddingBottom: 110 },
 deckInner: { flex: 1, position: "relative" },
 // Shadow donor: matches the inner card's shape so iOS/web can
 // compute the colored swipe glow against a real silhouette.
 // Sibling ProjectCard fills it and clips the rest.
 cardAbsolute: {
 flex: 1,
 backgroundColor: theme.bgElev,
 borderRadius: 18,
 },
 center: { flex: 1, alignItems: "center", justifyContent: "center" },
 card: {
 flex: 1,
 backgroundColor: theme.bgElev,
 borderRadius: 18,
 overflow: "hidden",
 },
 hero: {
 width: "100%",
 aspectRatio: 1,
 backgroundColor: theme.border,
 alignItems: "center",
 justifyContent: "center",
 borderBottomWidth: 1,
 borderBottomColor: theme.goldSoft,
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
 backgroundColor: theme.border,
 },
 cardBody: {
 padding: 14,
 gap: 8,
 flexShrink: 1,
 },
 cardFounder: {
 color: theme.textMuted,
 fontSize: 12,
 },
 cardHeadline: {
 color: theme.textMuted,
 fontSize: 12,
 },
 cardTitle: {
 color: theme.text,
 fontFamily: fonts.display,
 fontSize: 22,
 lineHeight: 26,
 letterSpacing: -0.3,
 },
 pillRow: {
 flexDirection: "row",
 flexWrap: "wrap",
 gap: 6,
 },
 pillSolid: {
 flexDirection: "row",
 alignItems: "center",
 gap: 5,
 paddingHorizontal: 10,
 paddingVertical: 4,
 borderRadius: 999,
 backgroundColor: theme.gold,
 },
 pillSolidText: {
 color: theme.bg,
 fontSize: 11,
 fontWeight: "600",
 },
 pillOutline: {
 paddingHorizontal: 10,
 paddingVertical: 4,
 borderRadius: 999,
 borderWidth: 1,
 borderColor: theme.border,
 backgroundColor: theme.bg,
 },
 pillOutlineText: {
 color: theme.textMuted,
 fontSize: 11,
 },
 cardDesc: {
 color: theme.textMuted,
 fontSize: 13,
 lineHeight: 19,
 },
 metaRow: {
 flexDirection: "row",
 flexWrap: "wrap",
 gap: 6,
 marginTop: 8,
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
 skillRow: {
 flexDirection: "row",
 flexWrap: "wrap",
 gap: 5,
 marginTop: 6,
 },
 skillChip: {
 paddingHorizontal: 8,
 paddingVertical: 4,
 borderWidth: 1,
 borderColor: theme.goldSoft,
 backgroundColor: theme.goldGlow,
 borderRadius: 2,
 },
 skillText: { color: theme.text, fontSize: 11 },
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
 reviewSeenWrap: {
 alignItems: "center",
 paddingBottom: 32,
 },
 reviewSeenBtn: {
 flexDirection: "row",
 alignItems: "center",
 gap: 8,
 paddingHorizontal: 18,
 paddingVertical: 12,
 borderRadius: 999,
 borderWidth: 1,
 borderColor: theme.gold,
 backgroundColor: theme.bgElev,
 },
 reviewSeenText: {
 fontFamily: fonts.sans,
 fontSize: 14,
 fontWeight: "500",
 color: theme.gold,
 },
 });
