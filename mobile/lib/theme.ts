// Mirror the web app's design tokens.
// Accent is the website's blue (Tailwind blue-400 / blue-500). The token
// names below still say "gold" because every screen references them that
// way; the values point at blue. Effectively a one-line theme swap.
export const theme = {
  bg: "#0a0a0a",          // background
  bgElev: "#111111",      // card
  border: "#272727",
  borderSoft: "#3a3a3a",
  goldSoft: "rgba(59,130,246,0.45)",    // accent border, blue-500 / 45%
  text: "#e6e6e6",
  textMuted: "#9ca3af",
  textDim: "#6b6b6b",
  gold: "#60a5fa",                       // accent, blue-400
  goldGlow: "rgba(59,130,246,0.12)",     // accent glow, blue-500 / 12%
  emerald: "#34d399",
  destructive: "#ef4444",
} as const;

export const fonts = {
  display: "Fraunces_700Bold",
  displayItalic: "Fraunces_700Bold_Italic",
  body: "Inter",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
} as const;
