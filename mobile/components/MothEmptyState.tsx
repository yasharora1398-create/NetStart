/**
 * Hummingbird hawk-moth empty states. Seven scene variants each
 * pair a hand-drawn SVG vignette with the moth.png mascot positioned
 * to suit the metaphor:
 *
 * blank — huge moth, tiny stem with bud (haven't started)
 * caught — wide horizon, branch curving across, far-perched moth
 * saves — oversized bookmark fills the frame, moth on its corner
 * threads — top-down envelope on a desk, moth rising out of it
 * apps — paper airplane angled up, moth riding the top wing
 * platform — almost pure negative space, one tiny moth drifting
 * filters — magnifying glass dominates, moth visible inside lens
 *
 * Both light and dark theme palettes are honored. The moth PNG is a
 * dark silhouette by default; in dark mode we tint it with the
 * primary text color so it reads against the dark card.
 *
 * The component is just illustration + copy — no buttons or CTAs.
 */
import { useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, {
 Circle,
 Defs,
 Ellipse,
 G,
 Line,
 Path,
 Rect,
} from "react-native-svg";
import { fonts } from "@/lib/theme";
import { useTheme, type ThemePalette } from "@/lib/themeMode";

const MOTH_SOURCE = require("@/assets/images/moth.png");

export type MothVariant =
 | "blank"
 | "caught"
 | "saves"
 | "threads"
 | "apps"
 | "platform"
 | "filters";

type MothPos = {
 size: number;
 x: number;
 y: number;
 rot: number;
};

const SCENE_W = 240;
const SCENE_H = 168;

type SceneRenderer = (palette: ScenePalette) => React.ReactElement;

type ScenePalette = {
 card: string;
 page: string;
 border: string;
 accent: string;
 accentBg: string;
 muted: string;
 secondary: string;
};

// ─── per-variant defaults (copy + scene + moth placement) ──────────

const VARIANTS: Record<
 MothVariant,
 {
 title: string;
 sub: string;
 moth: MothPos;
 scene: SceneRenderer;
 }
> = {
 // 1. blank slate — huge moth, tiny bud
 blank: {
 title: "No projects yet.",
 sub: "Hawk-moths need flowers to hover over. Set up a project to plant the first.",
 moth: { size: 120, x: 6, y: 2, rot: 70 },
 scene: (p) => (
 <Svg
 width="100%"
 height="100%"
 viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
 style={{ position: "absolute", top: 0, left: 0 }}
 >
 <Path
 stroke={p.accent}
 strokeWidth={1.6}
 fill="none"
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M 156 168 Q 158 152 154 138"
 />
 <Path
 stroke={p.accent}
 strokeWidth={1.4}
 fill="none"
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M 154 152 q 8 -2 12 4"
 />
 <Ellipse
 cx={154}
 cy={132}
 rx={6}
 ry={9}
 stroke={p.accent}
 strokeWidth={1.4}
 fill={p.accentBg}
 />
 <Path
 stroke={p.accent}
 strokeWidth={1}
 fill="none"
 strokeDasharray="1 4"
 strokeLinecap="round"
 d="M 96 70 Q 124 100 152 130"
 />
 </Svg>
 ),
 },

 // 2. caught up — wide horizon, branch, tiny perched moth
 caught: {
 title: "You're caught up.",
 sub: "Every project in your range has been visited. Wings up. New ones land here as founders post them.",
 moth: { size: 28, x: 184, y: 106, rot: 185 },
 scene: (p) => (
 <Svg
 width="100%"
 height="100%"
 viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
 style={{ position: "absolute", top: 0, left: 0 }}
 >
 <Circle
 cx={58}
 cy={60}
 r={22}
 stroke={p.accent}
 strokeWidth={1.4}
 fill={p.accentBg}
 />
 <Line
 x1={0}
 y1={116}
 x2={240}
 y2={116}
 stroke={p.muted}
 strokeWidth={1}
 strokeDasharray="2 4"
 />
 <Path
 stroke={p.accent}
 strokeWidth={1.6}
 fill="none"
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M -4 130 Q 90 112 196 124 L 224 130"
 />
 <Path
 stroke={p.accent}
 strokeWidth={1.4}
 fill={p.accentBg}
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M 198 124 q 14 -3 22 4 q -10 7 -22 -4 Z"
 />
 </Svg>
 ),
 },

 // 3. no saves — oversized bookmark, moth clipped to corner
 saves: {
 title: "No saves yet.",
 sub: "Tap the star on a project and it stays here, easy to find when you're ready to revisit.",
 moth: { size: 56, x: 68, y: -10, rot: 300 },
 scene: (p) => (
 <Svg
 width="100%"
 height="100%"
 viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
 style={{ position: "absolute", top: 0, left: 0 }}
 >
 <Path
 stroke={p.accent}
 strokeWidth={1.6}
 fill={p.accentBg}
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M 92 6 H 168 V 162 L 130 138 L 92 162 Z"
 />
 <Line
 x1={106}
 y1={60}
 x2={154}
 y2={60}
 stroke={p.accent}
 strokeWidth={1}
 strokeDasharray="2 3"
 opacity={0.6}
 />
 <Line
 x1={106}
 y1={78}
 x2={142}
 y2={78}
 stroke={p.accent}
 strokeWidth={1}
 strokeDasharray="2 3"
 opacity={0.6}
 />
 </Svg>
 ),
 },

 // 4. no threads — top-down envelope, moth rising out
 threads: {
 title: "No messages yet.",
 sub: "Quiet wings. When someone reaches out, their thread will land here.",
 moth: { size: 48, x: 96, y: 28, rot: 20 },
 scene: (p) => (
 <Svg
 width="100%"
 height="100%"
 viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
 style={{ position: "absolute", top: 0, left: 0 }}
 >
 <G
 stroke={p.accent}
 strokeWidth={1.6}
 fill="none"
 strokeLinecap="round"
 strokeLinejoin="round"
 >
 <Rect
 x={44}
 y={84}
 width={152}
 height={74}
 rx={3}
 fill={p.accentBg}
 />
 <Path d="M 44 92 L 120 138 L 196 92" />
 <Path d="M 44 158 L 96 122" />
 <Path d="M 196 158 L 144 122" />
 </G>
 </Svg>
 ),
 },

 // 5. nothing sent — paper airplane, moth on top wing
 apps: {
 title: "Nothing sent yet.",
 sub: "Hawk-moths cross continents, but only after they take off. Send a message to launch your first.",
 moth: { size: 42, x: 138, y: 56, rot: 55 },
 scene: (p) => (
 <Svg
 width="100%"
 height="100%"
 viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
 style={{ position: "absolute", top: 0, left: 0 }}
 >
 <Path
 stroke={p.accent}
 strokeWidth={1}
 fill="none"
 strokeDasharray="1 4"
 strokeLinecap="round"
 d="M 4 152 Q 80 130 130 100"
 />
 <G
 stroke={p.accent}
 strokeWidth={1.6}
 fill="none"
 strokeLinecap="round"
 strokeLinejoin="round"
 >
 <Path
 fill={p.accentBg}
 d="M 60 122 L 224 32 L 162 102 L 132 138 L 122 108 L 60 122 Z"
 />
 <Path d="M 162 102 L 132 138" />
 <Path d="M 162 102 L 122 108" />
 </G>
 </Svg>
 ),
 },

 // 6a. empty platform — almost pure negative space, drifting moth
 platform: {
 title: "Nothing here yet.",
 sub: "This corner is bare. Check back as more people and projects join.",
 moth: { size: 36, x: 194, y: 94, rot: 200 },
 scene: (p) => (
 <Svg
 width="100%"
 height="100%"
 viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
 style={{ position: "absolute", top: 0, left: 0 }}
 >
 <Line
 x1={0}
 y1={148}
 x2={240}
 y2={148}
 stroke={p.muted}
 strokeWidth={1}
 strokeDasharray="1 4"
 />
 <Path
 stroke={p.accent}
 strokeWidth={1.2}
 fill="none"
 strokeLinecap="round"
 d="M 56 148 Q 58 130 54 116"
 />
 <Path
 stroke={p.accent}
 strokeWidth={1.2}
 fill="none"
 strokeLinecap="round"
 d="M 188 148 Q 190 132 186 122"
 />
 </Svg>
 ),
 },

 // 6b. no matches — magnifying glass with moth inside the lens
 filters: {
 title: "No matches.",
 sub: "Hawk-moths home in by scent, and your filters narrow the bouquet. Loosen a few and the field opens up.",
 moth: { size: 68, x: 66, y: 46, rot: 245 },
 scene: (p) => (
 <Svg
 width="100%"
 height="100%"
 viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
 style={{ position: "absolute", top: 0, left: 0 }}
 >
 <Defs>{/* clip not needed — moth visually sits inside */}</Defs>
 <Circle
 cx={100}
 cy={80}
 r={64}
 stroke={p.accent}
 strokeWidth={2.4}
 fill="none"
 />
 <Circle
 cx={100}
 cy={80}
 r={58}
 stroke={p.accent}
 strokeWidth={1}
 fill={p.accentBg}
 />
 <Line
 x1={148}
 y1={126}
 x2={208}
 y2={186}
 stroke={p.accent}
 strokeWidth={6}
 strokeLinecap="round"
 />
 <Line
 x1={148}
 y1={126}
 x2={208}
 y2={186}
 stroke={p.card}
 strokeWidth={2}
 strokeLinecap="round"
 />
 </Svg>
 ),
 },
};

// ─── component ──────────────────────────────────────────────────────

export type MothEmptyStateProps = {
 variant: MothVariant;
 title?: string;
 sub?: string;
 ctx?: string;
};

export const MothEmptyState = ({
 variant,
 title,
 sub,
 ctx,
}: MothEmptyStateProps) => {
 const { theme, mode } = useTheme();
 const styles = useMemo(() => makeStyles(theme), [theme]);
 const v = VARIANTS[variant];

 const palette: ScenePalette = {
 card: theme.bgElev,
 page: theme.bg,
 border: theme.border,
 accent: theme.gold,
 accentBg: theme.goldGlow,
 muted: theme.textDim,
 secondary: theme.textMuted,
 };

 return (
 <View style={styles.wrap}>
 <View style={styles.card}>
 <View style={styles.scene}>
 {v.scene(palette)}
 <Image
 source={MOTH_SOURCE}
 style={[
 styles.moth,
 {
 width: v.moth.size,
 height: v.moth.size,
 left: v.moth.x,
 top: v.moth.y,
 transform: [{ rotate: `${v.moth.rot}deg` }],
 // moth.png is a dark silhouette. In dark mode tint it
 // with the primary text color so it reads on the dark
 // card; in light mode let its natural color stand.
 tintColor: mode === "dark" ? theme.text : undefined,
 },
 ]}
 resizeMode="contain"
 />
 </View>
 <Text style={styles.title}>{title ?? v.title}</Text>
 <Text style={styles.sub}>{sub ?? v.sub}</Text>
 {ctx ? <Text style={styles.ctx}>{ctx}</Text> : null}
 </View>
 </View>
 );
};

const makeStyles = (theme: ThemePalette) =>
 StyleSheet.create({
 wrap: {
 flex: 1,
 alignItems: "center",
 justifyContent: "center",
 paddingHorizontal: 20,
 paddingVertical: 28,
 },
 card: {
 width: "100%",
 maxWidth: 360,
 alignItems: "center",
 paddingHorizontal: 24,
 paddingVertical: 28,
 },
 scene: {
 width: SCENE_W,
 height: SCENE_H,
 position: "relative",
 marginBottom: 22,
 },
 moth: {
 position: "absolute",
 },
 title: {
 color: theme.text,
 fontFamily: fonts.display,
 fontSize: 18,
 letterSpacing: -0.2,
 marginBottom: 8,
 textAlign: "center",
 },
 sub: {
 color: theme.textMuted,
 fontSize: 13,
 lineHeight: 19,
 textAlign: "center",
 maxWidth: 300,
 },
 ctx: {
 marginTop: 14,
 color: theme.textDim,
 fontFamily: fonts.mono,
 fontSize: 10,
 letterSpacing: 1.4,
 textTransform: "uppercase",
 },
 });
