/**
 * Moth Loader. Circular arc with a small gap at the top; the
 * hummingbird hawk-moth rides the leading edge of the arc and orbits
 * the center while flapping its wings. Replaces ActivityIndicator on
 * loading surfaces where the brand wants to come through.
 *
 * In light mode the arc and label are near-black on the page bg.
 * In dark mode they're pure white on the page bg, per spec.
 *
 * Sizes default to a generous full-screen / hero scale. Pass `size`
 * for inline use.
 */
import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
 Easing,
 useAnimatedStyle,
 useSharedValue,
 withRepeat,
 withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { fonts } from "@/lib/theme";
import { useTheme } from "@/lib/themeMode";

const MOTH_SOURCE = require("@/assets/images/moth.png");

// Build the SVG arc path for a circle of radius r centered at
// (cx, cy), with a circular gap of `gapDeg` centered at the top.
const arcPath = (cx: number, cy: number, r: number, gapDeg: number) => {
 const half = gapDeg / 2;
 const startA = ((-90 + half) * Math.PI) / 180;
 const endA = ((-90 - half) * Math.PI) / 180;
 const x1 = cx + r * Math.cos(startA);
 const y1 = cy + r * Math.sin(startA);
 const x2 = cx + r * Math.cos(endA);
 const y2 = cy + r * Math.sin(endA);
 return `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 1 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`;
};

export type MothLoaderProps = {
 /** Outer diameter in px. Default 220. */
 size?: number;
 /** Moth diameter in px. Default scales to ~38% of size. */
 mothSize?: number;
 /** Show the "LOADING..." label below. Default true. */
 showLabel?: boolean;
 /** Override the loading text. Default "Loading". */
 label?: string;
 /** Spin speed in seconds per full rotation. Default 2.4. */
 speed?: number;
 /** Wing-flap period in seconds. Default 0.16. */
 flap?: number;
 /** Stroke width of the arc. Default 2.6. */
 stroke?: number;
 /** Gap angle at top in degrees. Default 46. */
 gap?: number;
 /** Direction of orbit. Default "cw". */
 direction?: "cw" | "ccw";
 /** Moth heading in degrees. Default 135 (matches design). */
 mothRot?: number;
};

export const MothLoader = ({
 size = 220,
 mothSize,
 showLabel = true,
 label = "Loading",
 speed = 2.4,
 flap = 0.16,
 stroke = 2.6,
 gap = 46,
 direction = "cw",
 mothRot = 135,
}: MothLoaderProps) => {
 const { mode } = useTheme();
 // Per spec: white arc + white label in dark mode; near-black in
 // light. We don't use the gold/accent here — the loader sits
 // mostly on background fills and needs maximum contrast.
 const ink = mode === "dark" ? "#FFFFFF" : "#161616";

 const computedMothSize = mothSize ?? Math.round(size * 0.38);

 // Two infinite Reanimated drivers — one for the orbit, one for the
 // wing flap. Both autoplay on mount and clean up on unmount.
 const spin = useSharedValue(0);
 const wing = useSharedValue(1);
 useEffect(() => {
 spin.value = 0;
 spin.value = withRepeat(
 withTiming(direction === "ccw" ? -360 : 360, {
 duration: speed * 1000,
 easing: Easing.bezier(0.45, 0.05, 0.55, 0.95),
 }),
 -1,
 false,
 );
 }, [spin, speed, direction]);
 useEffect(() => {
 wing.value = 1;
 wing.value = withRepeat(
 withTiming(0.45, {
 duration: (flap * 1000) / 2,
 easing: Easing.inOut(Easing.sin),
 }),
 -1,
 true,
 );
 }, [wing, flap]);

 const spinStyle = useAnimatedStyle(() => ({
 transform: [{ rotate: `${spin.value}deg` }],
 }));
 const wingStyle = useAnimatedStyle(() => ({
 transform: [{ scaleY: wing.value }],
 }));

 // ASCII dots animation for the label — same vibe as the web's
 // CSS keyframe content trick. Steps every 400ms.
 const [dots, setDots] = useState("");
 useEffect(() => {
 if (!showLabel) return;
 const seq = ["", ".", "..", "..."];
 let i = 0;
 const id = setInterval(() => {
 i = (i + 1) % seq.length;
 setDots(seq[i]);
 }, 400);
 return () => clearInterval(id);
 }, [showLabel]);

 const path = useMemo(() => arcPath(50, 50, 45, gap), [gap]);

 return (
 <View style={styles.stage}>
 <View style={[styles.loader, { width: size, height: size }]}>
 <Animated.View style={[StyleSheet.absoluteFill, spinStyle]}>
 <Svg viewBox="0 0 100 100" width="100%" height="100%">
 <Path
 d={path}
 stroke={ink}
 strokeWidth={stroke}
 strokeLinecap="round"
 fill="none"
 />
 </Svg>
 {/* Moth perched on the top of the arc. translateY by half
 its size so its center sits exactly on the stroke. */}
 <View
 style={[
 styles.mothWrap,
 {
 width: computedMothSize,
 height: computedMothSize,
 marginLeft: -computedMothSize / 2,
 marginTop: -computedMothSize / 2,
 },
 ]}
 pointerEvents="none"
 >
 <Animated.View style={[styles.fill, wingStyle]}>
 <Image
 source={MOTH_SOURCE}
 style={[
 styles.fill,
 {
 transform: [{ rotate: `${mothRot}deg` }],
 tintColor: ink,
 },
 ]}
 resizeMode="contain"
 />
 </Animated.View>
 </View>
 </Animated.View>
 </View>
 {showLabel ? (
 <Text
 style={[
 styles.label,
 {
 color: ink,
 opacity: 0.65,
 fontSize: Math.max(11, Math.round(size * 0.052)),
 },
 ]}
 >
 {label}
 {dots}
 </Text>
 ) : null}
 </View>
 );
};

const styles = StyleSheet.create({
 stage: {
 alignItems: "center",
 justifyContent: "center",
 gap: 24,
 },
 loader: {
 position: "relative",
 },
 fill: {
 width: "100%",
 height: "100%",
 },
 mothWrap: {
 position: "absolute",
 left: "50%",
 top: 0,
 },
 label: {
 fontFamily: fonts.mono,
 letterSpacing: 4,
 textTransform: "uppercase",
 },
});
