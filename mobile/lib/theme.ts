// Polln8 - single-accent forest green on warm off-white. This is the
// LIGHT theme used by screens that haven't migrated to `useTheme()`
// yet. Token names match the previous theme so unchanged components
// reskin automatically - `gold` now means forest green, `marigold`
// is the same accent, `goldGlow` is the accent-subtle bg, etc.
export const theme = {
 bg: "#FAFAF7", // warm off-white page
 bgElev: "#FFFFFF", // cards
 bgAlt: "#F2F1ED", // alt sections
 bgSubtle: "#FFFFFF", // subtle elevated (= cards)
 border: "#E1E1DC",
 borderSoft: "#D9D9D6", // stronger / input border
 goldSoft: "#C8DDD0", // accent subtle border
 text: "#0F1410", // primary text
 textMuted: "#4A4D52", // secondary text
 textDim: "#6B6E73", // muted / captions
 gold: "#1F5F3E", // forest green primary
 goldDeep: "#174A30", // primary hover
 goldLight: "#1F5F3E", // alias
 goldGlow: "#E8F0EA", // accent subtle bg (peach equivalent)
 marigold: "#1F5F3E",
 marigoldLight: "#E8F0EA",
 sage: "#C8DDD0",
 sageDeep: "#1F5F3E",
 cream: "#FFFFFF",
 emerald: "#1F5F3E", // success = accent
 destructive: "#7A2620",
} as const;

export const fonts = {
 display: "Fraunces_700Bold",
 displayMedium: "Fraunces_500Medium",
 displayItalic: "Fraunces_700Bold_Italic",
 body: "Inter",
 mono: "JetBrainsMono_400Regular",
 monoMedium: "JetBrainsMono_500Medium",
} as const;
