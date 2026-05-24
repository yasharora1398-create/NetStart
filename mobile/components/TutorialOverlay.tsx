/**
 * Pollin8 first-time tutorial overlay for the Match tab.
 *
 * 8 moments. The hawk moth glides smoothly between scene positions
 * via Reanimated. Each scene either advances on a Next/Done button
 * inside the bubble (M1-M4, M8) or waits for a swipe gesture (M5-M7).
 *
 * M1: Welcome - moth center, two buttons (Show me around / Skip)
 * M2: "this is the match page where you find your next cofounders..."
 * - no dim, full screen visible, Next button
 * M3: "these are the specifics of the people you are viewing..."
 * - dim with rounded spotlight on pills + headline group
 * M4: "if you like what you see, click this button..."
 * - dim with rounded spotlight on the Request chat button.
 * Moth in the middle, bubble's tail points at moth.
 * M5: "swipe left to save the person and see more information..."
 * - full-screen dim (no spotlight). Hand gesture animates
 * RIGHT→LEFT only. Waits for the user's swipe-left on the card.
 * M6: "Once you are done reading their information..."
 * - fake profile detail panel slides in. Moth at the bottom.
 * Waits for the user's swipe-right to close.
 * M7: "swipe to the right to pass..."
 * - full-screen dim. Hand gesture animates LEFT→RIGHT only.
 * Waits for swipe-right; on swipe, the card is hidden via the
 * parent's `onCardHide` callback.
 * M8: "You are all caught up! ..." - moth center, bubble with Done button.
 *
 * Smooth dim cutout uses an SVG mask with a rounded inner Rect (rx=22).
 * Hand gesture is a single-direction loop with fade-out + invisible
 * teleport back to the start, so the user only ever sees motion in the
 * intended direction.
 */
import { useEffect, useMemo, useState } from "react";
import {
 Dimensions,
 Pressable,
 StyleSheet,
 Text,
 View,
} from "react-native";
import {
 Gesture,
 GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
 Easing,
 interpolate,
 interpolateColor,
 runOnJS,
 useAnimatedProps,
 useAnimatedStyle,
 useSharedValue,
 withRepeat,
 withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Mask, Rect } from "react-native-svg";
const AnimatedRect = Animated.createAnimatedComponent(Rect);
import { ArrowRight, Hand } from "lucide-react-native";
import { HawkMoth } from "@/components/HawkMoth";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const DIM = "rgba(0, 0, 0, 0.75)";
const TWEEN = { duration: 700, easing: Easing.inOut(Easing.cubic) };

// Base size for the moth SVG. Scale animates per moment.
const MOTH_BASE = 280;

// Swipe threshold - translation magnitude on the active axis.
const SWIPE_THRESHOLD = 40;

export type Layout = { x: number; y: number; width: number; height: number };

type Moment = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type Props = {
 cardLayout: Layout | null;
 ctaLayout: Layout | null;
 specsLayout: Layout | null;
 onCardHide?: () => void;
 onComplete: () => void;
};

type MothTarget = { cx: number; cy: number; scale: number };
type BubbleTarget = {
 left: number;
 top: number;
 width: number;
 tail: "up" | "down" | "left" | "right" | null;
 tailOffset?: number;
};

// ============================================================
// Per-moment moth positions.
// ============================================================
const mothTargetFor = (
 moment: Moment,
 cardLayout: Layout | null,
 ctaLayout: Layout | null,
 specsLayout: Layout | null,
): MothTarget => {
 if (moment === 1) {
 return { cx: SCREEN_W / 2, cy: SCREEN_H * 0.18 + 80, scale: 1.25 };
 }
 if (moment === 2) {
 return { cx: SCREEN_W - 110, cy: 130, scale: 0.7 };
 }
 if (moment === 3 && specsLayout) {
 // Tucked on the LEFT, between the bubble (at top of screen) and
 // the specs spotlight. Smaller so it fits without overlapping
 // either the bubble above or the specs below.
 return {
 cx: 80,
 cy: Math.max(280, specsLayout.y - 80),
 scale: 0.45,
 };
 }
 if (moment === 4 && ctaLayout) {
 return {
 cx: SCREEN_W / 2,
 cy: SCREEN_H * 0.42,
 scale: 0.7,
 };
 }
 if (moment === 5) {
 // Right side, top - for swipe-LEFT direction the moth points left.
 return { cx: SCREEN_W - 100, cy: 140, scale: 0.55 };
 }
 if (moment === 6) {
 // Bottom of the screen, larger - moth peers up at the detail panel.
 return { cx: SCREEN_W / 2, cy: SCREEN_H - 170, scale: 0.85 };
 }
 if (moment === 7) {
 // Left side, top - for swipe-RIGHT direction.
 return { cx: 100, cy: 140, scale: 0.55 };
 }
 if (moment === 8) {
 return { cx: SCREEN_W / 2, cy: SCREEN_H * 0.32, scale: 1.1 };
 }
 return { cx: SCREEN_W / 2, cy: SCREEN_H * 0.25, scale: 1 };
};

// ============================================================
// Per-moment bubble positions.
// ============================================================
const bubbleTargetFor = (
 moment: Moment,
 cardLayout: Layout | null,
 ctaLayout: Layout | null,
 specsLayout: Layout | null,
): BubbleTarget | null => {
 if (moment === 2) {
 return {
 left: 20,
 top: 200,
 width: SCREEN_W - 40,
 tail: "up",
 tailOffset: SCREEN_W - 130,
 };
 }
 if (moment === 3 && specsLayout) {
 // Bubble sits directly ABOVE the moth, closer than before. The
 // moth SVG has empty space around its actual content (~14% of the
 // wrapper), so the bubble's bottom can extend ~30px into the
 // wrapper area without visually overlapping the moth body.
 const mothCy = Math.max(280, specsLayout.y - 80);
 const mothWrapperTop = mothCy - (MOTH_BASE * 0.45) / 2;
 const estBubbleHeight = 220;
 const top = Math.max(60, mothWrapperTop + 25 - estBubbleHeight);
 return {
 left: 20,
 top,
 width: SCREEN_W - 40,
 tail: "down",
 tailOffset: 48,
 };
 }
 if (moment === 4 && ctaLayout) {
 const bubbleHeight = 160;
 const top = Math.max(60, SCREEN_H * 0.42 - 100 - bubbleHeight);
 return {
 left: 20,
 top,
 width: SCREEN_W - 40,
 tail: "down",
 tailOffset: (SCREEN_W - 40) / 2 - 12,
 };
 }
 if (moment === 5) {
 // Bubble below the moth, full-width. Tail up-right pointing at moth.
 return {
 left: 20,
 top: 240,
 width: SCREEN_W - 40,
 tail: "up",
 tailOffset: SCREEN_W - 130,
 };
 }
 if (moment === 6) {
 // Bubble REALLY close to the moth - bottom edge sits well into
 // the moth's wrapper area so the tail visibly emerges from the
 // moth's head.
 const mothHalf = (MOTH_BASE * 0.85) / 2; // 119
 const mothWrapperTop = SCREEN_H - 170 - mothHalf;
 const estBubbleHeight = 150;
 const top = Math.max(
 60,
 mothWrapperTop + 60 - estBubbleHeight,
 );
 return {
 left: 20,
 top,
 width: SCREEN_W - 40,
 tail: "down",
 tailOffset: (SCREEN_W - 40) / 2 - 12,
 };
 }
 if (moment === 7) {
 return {
 left: 20,
 top: 240,
 width: SCREEN_W - 40,
 tail: "up",
 tailOffset: 80, // tail toward left where moth is
 };
 }
 if (moment === 8) {
 return {
 left: 24,
 top: SCREEN_H * 0.32 + 180,
 width: SCREEN_W - 48,
 tail: "up",
 tailOffset: (SCREEN_W - 48) / 2 - 12,
 };
 }
 return null;
};


// ============================================================
// Main overlay component.
// ============================================================
export const TutorialOverlay = ({
 cardLayout,
 ctaLayout,
 specsLayout,
 onCardHide,
 onComplete,
}: Props) => {
 const { theme } = useTheme();
 const styles = useMemo(() => makeStyles(theme), [theme]);
 const [moment, setMoment] = useState<Moment>(1);
 const [exiting, setExiting] = useState(false);
 const [showDetail, setShowDetail] = useState(false);

 const initial = mothTargetFor(1, cardLayout, ctaLayout, specsLayout);
 const mothCx = useSharedValue(initial.cx);
 const mothCy = useSharedValue(initial.cy);
 const mothScale = useSharedValue(initial.scale);

 // Skip-button morph: 0 = inside the M1 bubble, 1 = small pill at the
 // top-right corner. Animated when the user taps "Show me around".
 const skipT = useSharedValue(0);
 const handleShowMeAround = () => {
 skipT.value = withTiming(1, {
 duration: 420,
 easing: Easing.out(Easing.cubic),
 });
 advance(2);
 };

 // ------- Animated spotlight rect (the un-dimmed window) -------
 // Same rect used across all moments; we just retarget it on moment
 // change. M1/M5/M6/M7 collapse it to a point (full dim). M2/M8
 // expand it to the whole screen (no visible dim). M3 morphs it to
 // the specs region, M4 to the CTA. The transition tweens smoothly.
 const RECT_PAD = 8;
 const sx = useSharedValue(SCREEN_W / 2);
 const sy = useSharedValue(SCREEN_H / 2);
 const sw = useSharedValue(0);
 const sh = useSharedValue(0);
 const haloOpacity = useSharedValue(0);

 useEffect(() => {
 let tx = SCREEN_W / 2;
 let ty = SCREEN_H / 2;
 let tw = 0;
 let th = 0;
 let halo = 0;

 if (moment === 2 || moment === 8) {
 // No dim - full-screen cutout.
 tx = 0;
 ty = 0;
 tw = SCREEN_W;
 th = SCREEN_H;
 } else if (moment === 3 && specsLayout) {
 tx = Math.max(0, specsLayout.x - RECT_PAD);
 ty = Math.max(0, specsLayout.y - RECT_PAD);
 tw = Math.min(SCREEN_W - tx, specsLayout.width + RECT_PAD * 2);
 th = Math.min(SCREEN_H - ty, specsLayout.height + RECT_PAD * 2);
 halo = 1;
 } else if (moment === 4 && ctaLayout) {
 tx = Math.max(0, ctaLayout.x - RECT_PAD);
 ty = Math.max(0, ctaLayout.y - RECT_PAD);
 tw = Math.min(SCREEN_W - tx, ctaLayout.width + RECT_PAD * 2);
 th = Math.min(SCREEN_H - ty, ctaLayout.height + RECT_PAD * 2);
 halo = 1;
 }
 // Else: M1/M5/M6/M7 - full dim. tx/ty stay at center, tw/th=0.

 sx.value = withTiming(tx, TWEEN);
 sy.value = withTiming(ty, TWEEN);
 sw.value = withTiming(tw, TWEEN);
 sh.value = withTiming(th, TWEEN);
 haloOpacity.value = withTiming(halo, TWEEN);
 }, [moment, ctaLayout, specsLayout, sx, sy, sw, sh, haloOpacity]);

 useEffect(() => {
 const target = mothTargetFor(moment, cardLayout, ctaLayout, specsLayout);
 mothCx.value = withTiming(target.cx, TWEEN);
 mothCy.value = withTiming(target.cy, TWEEN);
 mothScale.value = withTiming(target.scale, TWEEN);
 }, [moment, cardLayout, ctaLayout, specsLayout, mothCx, mothCy, mothScale]);

 // Show / hide the detail panel on M6 transitions.
 useEffect(() => {
 if (moment === 6) setShowDetail(true);
 else setShowDetail(false);
 }, [moment]);

 const advance = (next: Moment) => setMoment(next);

 const finish = () => {
 setExiting(true);
 setTimeout(onComplete, 220);
 };

 // M7 swipe-right: hide the tutorial card via parent callback, then advance.
 const handleM7SwipeRight = () => {
 onCardHide?.();
 advance(8);
 };

 // Each moment that requires a swipe gets its OWN stable gesture,
 // bound only to its own GestureDetector. Sharing one gesture across
 // multiple detectors that mount/unmount has caused detection to
 // miss the second swipe in a row.
 const m5Gesture = useMemo(
 () =>
 Gesture.Pan().onEnd((e) => {
 "worklet";
 if (e.translationX < -SWIPE_THRESHOLD) {
 runOnJS(advance)(6);
 }
 }),
 // eslint-disable-next-line react-hooks/exhaustive-deps
 [],
 );
 const m6Gesture = useMemo(
 () =>
 Gesture.Pan().onEnd((e) => {
 "worklet";
 if (e.translationY > SWIPE_THRESHOLD) {
 runOnJS(advance)(7);
 }
 }),
 // eslint-disable-next-line react-hooks/exhaustive-deps
 [],
 );
 const m7Gesture = useMemo(
 () =>
 Gesture.Pan().onEnd((e) => {
 "worklet";
 if (e.translationX > SWIPE_THRESHOLD) {
 runOnJS(handleM7SwipeRight)();
 }
 }),
 // eslint-disable-next-line react-hooks/exhaustive-deps
 [],
 );

 const mothStyle = useAnimatedStyle(() => ({
 position: "absolute",
 left: mothCx.value - MOTH_BASE / 2,
 top: mothCy.value - MOTH_BASE / 2,
 width: MOTH_BASE,
 height: MOTH_BASE,
 transform: [{ scale: mothScale.value }],
 }));

 const bubbleTarget = bubbleTargetFor(moment, cardLayout, ctaLayout, specsLayout);

 return (
 <View
 style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}
 pointerEvents="box-none"
 >
 {/* Animated dim layer - single rendered layer whose spotlight
 rect tweens between moments. M2/M8 = full-screen cutout (no
 dim visible). M3 = specs rect. M4 = CTA rect. M1/M5/M6/M7 =
 collapsed to a point (full dim). */}
 <AnimatedDimLayer
 sx={sx}
 sy={sy}
 sw={sw}
 sh={sh}
 haloOpacity={haloOpacity}
 />

 {/* M5 swipe-left detector */}
 {moment === 5 && cardLayout && (
 <GestureDetector gesture={m5Gesture}>
 <View
 pointerEvents="auto"
 style={{
 position: "absolute",
 left: cardLayout.x,
 top: cardLayout.y,
 width: cardLayout.width,
 height: cardLayout.height,
 }}
 />
 </GestureDetector>
 )}

 {/* M7 swipe-right detector */}
 {moment === 7 && cardLayout && (
 <GestureDetector gesture={m7Gesture}>
 <View
 pointerEvents="auto"
 style={{
 position: "absolute",
 left: cardLayout.x,
 top: cardLayout.y,
 width: cardLayout.width,
 height: cardLayout.height,
 }}
 />
 </GestureDetector>
 )}

 {/* M5/M7 hand-gesture animation - bigger, single-direction loop */}
 {(moment === 5 || moment === 7) && cardLayout && (
 <HandGesture
 direction={moment === 5 ? "left" : "right"}
 cardLayout={cardLayout}
 />
 )}

 {/* M6 fake profile detail panel + swipe-DOWN detector */}
 {showDetail && (
 <GestureDetector gesture={m6Gesture}>
 <View pointerEvents="auto" style={StyleSheet.absoluteFill}>
 <ProfileDetailDemo />
 </View>
 </GestureDetector>
 )}

 {/* M1: welcome bubble (moth above, primary button + Skip placeholder) */}
 {moment === 1 && <M1WelcomeBubble onShowAround={handleShowMeAround} />}

 {/* M2 / M3 / M4: scene bubble with Next button */}
 {(moment === 2 || moment === 3 || moment === 4) && bubbleTarget && (
 <SceneBubble
 target={bubbleTarget}
 text={COPY[moment]}
 onAction={() => advance((moment + 1) as Moment)}
 actionLabel="Next"
 />
 )}

 {/* M5 / M6 / M7: bubble with NO button (waits for swipe) */}
 {(moment === 5 || moment === 6 || moment === 7) && bubbleTarget && (
 <SceneBubble target={bubbleTarget} text={COPY[moment]} />
 )}

 {/* M8: bubble with Done button → finishes */}
 {moment === 8 && bubbleTarget && (
 <SceneBubble
 target={bubbleTarget}
 text={COPY[8]}
 onAction={finish}
 actionLabel="Done"
 />
 )}

 {/* Skip - animated morph from inside the M1 bubble (placeholder
 slot) to a small pill at the top-right corner. Visible at all
 moments except M8 (Done button replaces it). */}
 {moment !== 8 && <AnimatedSkip skipT={skipT} onPress={finish} />}
 </View>
 );
};

// ============================================================
// COPY per moment.
// ============================================================
const COPY: Record<2 | 3 | 4 | 5 | 6 | 7 | 8, string> = {
 2: "This is the match page where you find your next co-founders, or join a new project.",
 3: "These are the specifics of the people you're viewing. It shows their location, their commitment, and their skills.",
 4: "If you like what you see, tap this button and they'll be able to decide if they want to bring you onto their project.",
 5: "Swipe left to save this person to your Saved tab and see more about their background and what they're working on.",
 6: "Once you're done reading their information, swipe down to exit this page.",
 7: "Swipe right to pass if this profile isn't what you're looking for.",
 8: "You're all caught up! Start swiping to find your next partner. If you need to come back to this tutorial, head to the bottom of the MyNet tab.",
};

// ============================================================
// ANIMATED DIM LAYER - full-screen black 75% with a rounded SVG-mask
// cutout whose rect (sx, sy, sw, sh) is driven by shared values.
// All transitions between moments tween smoothly.
// ============================================================
type SV = { value: number };

const AnimatedDimLayer = ({
 sx,
 sy,
 sw,
 sh,
 haloOpacity,
}: {
 sx: SV;
 sy: SV;
 sw: SV;
 sh: SV;
 haloOpacity: SV;
}) => {
 const radius = 22;

 const rectProps = useAnimatedProps(() => ({
 x: sx.value,
 y: sy.value,
 width: sw.value,
 height: sh.value,
 }));

 const haloStyle = useAnimatedStyle(() => ({
 position: "absolute",
 left: sx.value,
 top: sy.value,
 width: sw.value,
 height: sh.value,
 borderRadius: radius,
 borderWidth: 2,
 borderColor: "rgba(244,162,97,0.5)",
 opacity: haloOpacity.value,
 }));

 return (
 <View pointerEvents="auto" style={StyleSheet.absoluteFill}>
 <Svg
 width={SCREEN_W}
 height={SCREEN_H}
 style={StyleSheet.absoluteFill}
 >
 <Defs>
 <Mask id="spotlight-mask" maskUnits="userSpaceOnUse">
 <Rect
 x="0"
 y="0"
 width={SCREEN_W}
 height={SCREEN_H}
 fill="white"
 />
 <AnimatedRect
 animatedProps={rectProps}
 rx={radius}
 ry={radius}
 fill="black"
 />
 </Mask>
 </Defs>
 <Rect
 x="0"
 y="0"
 width={SCREEN_W}
 height={SCREEN_H}
 fill="black"
 fillOpacity={0.75}
 mask="url(#spotlight-mask)"
 />
 </Svg>
 <Animated.View style={haloStyle} pointerEvents="none" />
 </View>
 );
};

// ============================================================
// M1 WELCOME bubble.
// ============================================================
const M1WelcomeBubble = ({
 onShowAround,
}: {
 onShowAround: () => void;
}) => {
 const { theme } = useTheme();
 const styles = useMemo(() => makeStyles(theme), [theme]);
 const mothBottom = SCREEN_H * 0.18 + 80 + (MOTH_BASE * 1.25) / 2;
 return (
 <View
 style={[
 styles.bubble,
 {
 top: mothBottom - 30,
 left: 20,
 right: 20,
 gap: 18,
 },
 ]}
 >
 <Text style={styles.welcomeBubbleText}>
 Welcome to Polln8.{"\n"}Want a quick tour?
 </Text>
 <View style={styles.btnRow}>
 <Pressable
 onPress={onShowAround}
 style={({ pressed }) => [
 styles.primaryBtn,
 pressed && { backgroundColor: theme.goldDeep },
 ]}
 >
 <Text style={styles.primaryBtnText}>Show me around</Text>
 </Pressable>
 {/* Placeholder slot - the AnimatedSkip overlays this exact spot
 in M1, then morphs to the top-right when M2 starts. */}
 <View style={[styles.secondaryBtn, { opacity: 0 }]} />
 </View>
 </View>
 );
};

// ============================================================
// SCENE BUBBLE - generic bubble with copy + optional action button.
// ============================================================
const SceneBubble = ({
 target,
 text,
 onAction,
 actionLabel,
}: {
 target: BubbleTarget;
 text: string;
 onAction?: () => void;
 actionLabel?: string;
}) => {
 const { theme } = useTheme();
 const styles = useMemo(() => makeStyles(theme), [theme]);
 return (
 <View
 style={[
 styles.bubble,
 {
 left: target.left,
 top: target.top,
 width: target.width,
 gap: 14,
 },
 ]}
 >
 <Text style={styles.bubbleText}>{text}</Text>
 {onAction && actionLabel && (
 <Pressable
 onPress={onAction}
 style={({ pressed }) => [
 styles.actionBtn,
 pressed && { backgroundColor: theme.goldDeep },
 ]}
 >
 <Text style={styles.actionBtnText}>{actionLabel}</Text>
 <ArrowRight size={16} color={theme.textOnPrimary} strokeWidth={2.4} />
 </Pressable>
 )}
 </View>
 );
};

// ============================================================
// BUBBLE TAIL - small triangle pointing in one of four directions.
// ============================================================
const BubbleTail = ({
 tail,
 tailOffset,
}: {
 tail: "up" | "down" | "left" | "right";
 tailOffset: number;
}) => {
 const { theme } = useTheme();
 const c = theme.bubble;
 if (tail === "up") {
 return (
 <View
 style={{
 position: "absolute",
 top: -14,
 left: tailOffset,
 width: 0,
 height: 0,
 borderLeftWidth: 12,
 borderRightWidth: 12,
 borderBottomWidth: 14,
 borderLeftColor: "transparent",
 borderRightColor: "transparent",
 borderBottomColor: c,
 }}
 />
 );
 }
 if (tail === "down") {
 return (
 <View
 style={{
 position: "absolute",
 bottom: -14,
 left: tailOffset,
 width: 0,
 height: 0,
 borderLeftWidth: 12,
 borderRightWidth: 12,
 borderTopWidth: 14,
 borderLeftColor: "transparent",
 borderRightColor: "transparent",
 borderTopColor: c,
 }}
 />
 );
 }
 if (tail === "left") {
 return (
 <View
 style={{
 position: "absolute",
 left: -14,
 top: tailOffset,
 width: 0,
 height: 0,
 borderTopWidth: 12,
 borderBottomWidth: 12,
 borderRightWidth: 14,
 borderTopColor: "transparent",
 borderBottomColor: "transparent",
 borderRightColor: c,
 }}
 />
 );
 }
 return (
 <View
 style={{
 position: "absolute",
 right: -14,
 top: tailOffset,
 width: 0,
 height: 0,
 borderTopWidth: 12,
 borderBottomWidth: 12,
 borderLeftWidth: 14,
 borderTopColor: "transparent",
 borderBottomColor: "transparent",
 borderLeftColor: c,
 }}
 />
 );
};

// ============================================================
// HAND GESTURE - single-direction looping animation.
//
// For "left" (swipe-left): the hand starts on the right side of the
// card, slides left, fades out at the left edge, then teleports back
// to the right INVISIBLY and fades back in. The user only ever sees
// motion right→left. Same logic mirrored for "right".
// ============================================================
const HandGesture = ({
 direction,
 cardLayout,
}: {
 direction: "left" | "right";
 cardLayout: Layout;
}) => {
 const t = useSharedValue(0);
 const cardCenterY = cardLayout.y + cardLayout.height / 2;
 const HAND_SIZE = 90;

 // Start / end x (centered hand position).
 const startX =
 direction === "left"
 ? cardLayout.x + cardLayout.width - HAND_SIZE / 2 - 30
 : cardLayout.x + 30;
 const endX =
 direction === "left"
 ? cardLayout.x + 30
 : cardLayout.x + cardLayout.width - HAND_SIZE / 2 - 30;

 useEffect(() => {
 t.value = withRepeat(withTiming(1, { duration: 1800 }), -1, false);
 }, [t]);

 const handStyle = useAnimatedStyle(() => {
 // Visible motion: 0 → 0.7 (forward), invisible reset: 0.7 → 1.
 // Opacity: fade in 0 → 0.1, hold to 0.65, fade out 0.65 → 0.75,
 // stay invisible 0.75 → 0.9, fade back in 0.9 → 1.
 const x = interpolate(
 t.value,
 [0, 0.65, 0.75, 1],
 [startX, endX, startX, startX],
 );
 const opacity = interpolate(
 t.value,
 [0, 0.1, 0.65, 0.75, 0.9, 1],
 [0, 1, 1, 0, 0, 1],
 );
 return {
 position: "absolute",
 left: x,
 top: cardCenterY - HAND_SIZE / 2,
 width: HAND_SIZE,
 height: HAND_SIZE,
 borderRadius: HAND_SIZE / 2,
 backgroundColor: "rgba(255,255,255,0.18)",
 borderWidth: 2,
 borderColor: "rgba(255,255,255,0.55)",
 alignItems: "center",
 justifyContent: "center",
 opacity,
 };
 });

 return (
 <Animated.View style={handStyle} pointerEvents="none">
 <Hand size={48} color="#FFFFFF" strokeWidth={2.4} />
 </Animated.View>
 );
};

// ============================================================
// PROFILE DETAIL - fake "more info" panel for M6.
// ============================================================
const ProfileDetailDemo = () => {
 const { theme } = useTheme();
 const styles = useMemo(() => makeStyles(theme), [theme]);
 return (
 <View style={styles.detail}>
 <View style={styles.detailHandle} />
 <Text style={styles.detailName}>Riley Pham</Text>
 <Text style={styles.detailHeadline}>
 Senior eng · ex-Stripe · San Francisco
 </Text>
 <View style={styles.detailSection}>
 <Text style={styles.detailLabel}>Past projects</Text>
 <Text style={styles.detailBody}>
 Payments infrastructure at Stripe. Built developer tooling shipped
 to 80k merchants. Co-founded a YC W22 fintech (acquired).
 </Text>
 </View>
 <View style={styles.detailSection}>
 <Text style={styles.detailLabel}>Education</Text>
 <Text style={styles.detailBody}>
 BS Computer Science, Stanford. CS161 TA.
 </Text>
 </View>
 <View style={styles.detailSection}>
 <Text style={styles.detailLabel}>What they're shipping</Text>
 <Text style={styles.detailBody}>
 AI agent that reconciles invoices for SMBs. ~120 paying customers,
 $42k MRR, 18% MoM growth.
 </Text>
 </View>
 <View style={styles.detailSection}>
 <Text style={styles.detailLabel}>Looking for</Text>
 <Text style={styles.detailBody}>
 Co-founder. Equity 30-40%. Full-time within 60 days.
 </Text>
 </View>
 </View>
 );
};

// ============================================================
// ANIMATED SKIP - morphs between two positions:
// skipT = 0 → inside the M1 bubble's right-half "secondary" slot
// skipT = 1 → small dark pill at the top-right corner
// Position, size, border, background, and text color all interpolate.
// The dark pill ensures visibility on bright (no-dim) moments like M2.
// ============================================================
const AnimatedSkip = ({
 skipT,
 onPress,
}: {
 skipT: { value: number };
 onPress: () => void;
}) => {
 const { theme } = useTheme();
 // M1 placement: align with the right slot of M1's btnRow.
 const M1_TOP = SCREEN_H * 0.18 + 80 + (MOTH_BASE * 1.25) / 2 - 30 + 18 + 52 + 18;
 const M1_INNER_W = SCREEN_W - 40 - 36; // bubble width - paddingH*2
 const M1_BTN_W = (M1_INNER_W - 10) / 2;
 const M1_LEFT = 20 + 18 + M1_BTN_W + 10; // skip is the second button
 // Final placement: top-right pill.
 const F_TOP = 56;
 const F_WIDTH = 64;
 const F_HEIGHT = 32;
 const F_LEFT = SCREEN_W - 16 - F_WIDTH;

 const wrapStyle = useAnimatedStyle(() => {
 const t = skipT.value;
 return {
 position: "absolute",
 left: interpolate(t, [0, 1], [M1_LEFT, F_LEFT]),
 top: interpolate(t, [0, 1], [M1_TOP, F_TOP]),
 width: interpolate(t, [0, 1], [M1_BTN_W, F_WIDTH]),
 height: interpolate(t, [0, 1], [50, F_HEIGHT]),
 borderRadius: interpolate(t, [0, 1], [12, 16]),
 borderWidth: interpolate(t, [0, 1], [1.5, 0]),
 borderColor: interpolateColor(
 t,
 [0, 1],
 [theme.borderSoft, "rgba(0,0,0,0)"],
 ),
 backgroundColor: interpolateColor(
 t,
 [0, 1],
 ["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"],
 ),
 alignItems: "center",
 justifyContent: "center",
 };
 });

 const textStyle = useAnimatedStyle(() => {
 const t = skipT.value;
 return {
 fontSize: interpolate(t, [0, 1], [15, 13]),
 fontWeight: "600",
 letterSpacing: 0.2,
 color: interpolateColor(
 t,
 [0, 1],
 [theme.textMuted, "#FFFFFF"],
 ),
 };
 });

 return (
 <Animated.View style={wrapStyle}>
 <Pressable
 onPress={onPress}
 hitSlop={8}
 style={{
 flex: 1,
 width: "100%",
 alignItems: "center",
 justifyContent: "center",
 }}
 >
 <Animated.Text style={textStyle}>Skip</Animated.Text>
 </Pressable>
 </Animated.View>
 );
};

// ============================================================
// STYLES
// ============================================================
const makeStyles = (theme: ThemePalette) => StyleSheet.create({
 bubble: {
 position: "absolute",
 backgroundColor: theme.bubble,
 borderRadius: 22,
 paddingVertical: 18,
 paddingHorizontal: 18,
 shadowColor: "#1F1008",
 shadowOpacity: 0.32,
 shadowRadius: 28,
 shadowOffset: { width: 0, height: 14 },
 elevation: 14,
 },
 bubbleText: {
 color: theme.text,
 fontSize: 16,
 lineHeight: 22,
 fontWeight: "500",
 },
 welcomeBubbleText: {
 color: theme.text,
 fontSize: 20,
 lineHeight: 26,
 fontWeight: "600",
 textAlign: "center",
 letterSpacing: -0.2,
 },

 btnRow: {
 flexDirection: "row",
 gap: 10,
 },
 primaryBtn: {
 flex: 1,
 height: 50,
 borderRadius: 12,
 backgroundColor: theme.gold,
 alignItems: "center",
 justifyContent: "center",
 shadowColor: theme.gold,
 shadowOpacity: 0.4,
 shadowRadius: 12,
 shadowOffset: { width: 0, height: 4 },
 elevation: 4,
 },
 primaryBtnText: {
 color: "#FFFFFF",
 fontSize: 15,
 fontWeight: "700",
 letterSpacing: -0.1,
 },
 secondaryBtn: {
 flex: 1,
 height: 50,
 borderRadius: 12,
 backgroundColor: "transparent",
 borderWidth: 1.5,
 borderColor: theme.borderSoft,
 alignItems: "center",
 justifyContent: "center",
 },
 secondaryBtnText: {
 color: theme.textMuted,
 fontSize: 15,
 fontWeight: "600",
 },

 actionBtn: {
 alignSelf: "flex-end",
 paddingHorizontal: 18,
 height: 42,
 borderRadius: 11,
 backgroundColor: theme.gold,
 flexDirection: "row",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 shadowColor: theme.gold,
 shadowOpacity: 0.32,
 shadowRadius: 10,
 shadowOffset: { width: 0, height: 4 },
 elevation: 4,
 },
 actionBtnText: {
 color: "#FFFFFF",
 fontSize: 14,
 fontWeight: "700",
 letterSpacing: -0.05,
 },

 skipLink: {
 position: "absolute",
 top: 56,
 right: 16,
 paddingVertical: 8,
 paddingHorizontal: 12,
 },
 skipLinkText: {
 color: "rgba(255,255,255,0.95)",
 fontSize: 14,
 fontWeight: "600",
 letterSpacing: 0.2,
 },

 detail: {
 position: "absolute",
 left: 16,
 right: 16,
 top: 80,
 bottom: 240,
 backgroundColor: theme.bgElev,
 borderRadius: 22,
 padding: 22,
 paddingTop: 14,
 shadowColor: "#1F1008",
 shadowOpacity: 0.32,
 shadowRadius: 30,
 shadowOffset: { width: 0, height: 18 },
 elevation: 16,
 },
 detailHandle: {
 alignSelf: "center",
 width: 40,
 height: 4,
 borderRadius: 2,
 backgroundColor: theme.borderSoft,
 marginBottom: 14,
 },
 detailName: {
 color: theme.text,
 fontFamily: fonts.display,
 fontSize: 26,
 letterSpacing: -0.4,
 },
 detailHeadline: {
 color: theme.textMuted,
 fontSize: 13,
 marginTop: 4,
 marginBottom: 14,
 },
 detailSection: {
 marginTop: 10,
 },
 detailLabel: {
 color: theme.gold,
 fontFamily: fonts.mono,
 fontSize: 10,
 letterSpacing: 1.6,
 textTransform: "uppercase",
 marginBottom: 4,
 },
 detailBody: {
 color: theme.textMuted,
 fontSize: 13,
 lineHeight: 18,
 },
});
