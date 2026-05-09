/**
 * Vettd theme system — forest-green accent on warm off-white (light)
 * and deep cool grey-green (dark). The palette follows a single-accent
 * model: the green is reserved for CTAs, focus rings, links, and brand
 * moments; everything else is neutral.
 *
 * App boots in DARK by default. Existing users with a saved preference
 * keep their preference. Persisted to AsyncStorage as
 * `netstart_theme_mode`.
 *
 * Screens that read `theme` from "@/lib/theme" (the static export) stay
 * frozen at module-load time. To make a screen mode-aware, swap its
 * `import { theme } from "@/lib/theme"` for `const { theme } = useTheme()`
 * and rebuild its styles inside the component (see `app/(tabs)/mynet.tsx`
 * for the pattern).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemePalette = {
  // Backgrounds
  bg: string;
  bgElev: string;     // card / elevated surface
  bgAlt: string;      // alt section
  bgSubtle: string;   // subtle elevated

  // Borders
  border: string;
  borderSoft: string;

  // Text
  text: string;
  textMuted: string;
  textDim: string;
  textOnPrimary: string;

  // Brand (legacy token names — `gold` = forest/sage accent,
  // `marigold` = same accent, `goldGlow` = Accent Subtle bg)
  gold: string;
  goldDeep: string;
  goldLight: string;
  goldGlow: string;
  goldSoft: string;
  marigold: string;
  marigoldLight: string;

  // Old aliases (still referenced by existing components — repurposed)
  sage: string;
  sageDeep: string;
  cream: string;

  // Floating-element surface (speech bubbles, popovers — needs more
  // contrast against the page than `bgElev`/cards).
  bubble: string;

  // Status
  emerald: string;
  destructive: string;
  warning: string;
  info: string;
};

export const lightTheme: ThemePalette = {
  // Backgrounds
  bg: "#FAFAF7",            // warm off-white page
  bgElev: "#FFFFFF",         // cards
  bgAlt: "#F2F1ED",          // alt sections
  bgSubtle: "#FFFFFF",       // subtle elevated (= cards)

  // Borders
  border: "#E1E1DC",
  borderSoft: "#D9D9D6",     // stronger border

  // Text
  text: "#0F1410",
  textMuted: "#4A4D52",
  textDim: "#6B6E73",
  textOnPrimary: "#FFFFFF",  // white on forest green button

  // Accent — forest green
  gold: "#1F5F3E",           // primary
  goldDeep: "#174A30",       // primary hover
  goldLight: "#1F5F3E",
  goldGlow: "#E8F0EA",        // ACCENT SUBTLE BG
  goldSoft: "#C8DDD0",        // accent subtle border
  marigold: "#1F5F3E",
  marigoldLight: "#E8F0EA",   // accent subtle bg (alias)

  sage: "#C8DDD0",           // accent subtle border
  sageDeep: "#1F5F3E",       // accent
  cream: "#FFFFFF",

  bubble: "#FFFFFF",          // pops against #FAFAF7 page

  emerald: "#1F5F3E",         // success = accent in light
  destructive: "#7A2620",
  warning: "#7A5520",
  info: "#2D4654",
};

// Mirrors the web's `.dark` palette in src/index.css: near-pure-black
// page with neutral dark surfaces, accented by a slightly darker sage
// (web's --primary at hsl(142 28% 42%)). Green is punctuation, not the
// dominant chroma.
export const darkTheme: ThemePalette = {
  // Backgrounds
  bg: "#050505",             // near pure black (web --background)
  bgElev: "#0F0F0F",          // cards (web --card)
  bgAlt: "#0A0A0A",           // alt sections (web --secondary)
  bgSubtle: "#0F0F0F",        // = cards

  // Borders
  border: "#1F1F1F",          // web --border (0 0% 12%)
  borderSoft: "#2D2D2D",      // slightly lifted for stronger borders

  // Text
  text: "#F3F3F1",            // web --foreground (60 6% 95%)
  textMuted: "#C2C2BD",        // between text and textDim
  textDim: "#A7A7A0",          // web --muted-foreground (60 4% 64%)
  textOnPrimary: "#050505",    // matches web --primary-foreground (= bg)

  // Accent: sage green, web --primary (142 28% 42%)
  gold: "#4D8963",
  goldDeep: "#569F73",          // web --gold-deep (144 30% 48%)
  goldLight: "#4D8963",
  goldGlow: "#111714",          // web --accent (142 15% 8%)
  goldSoft: "#1F2D24",          // accent subtle border
  marigold: "#4D8963",
  marigoldLight: "#111714",

  sage: "#1F2D24",
  sageDeep: "#4D8963",
  cream: "#F3F3F1",

  bubble: "#1A1A1A",            // surface elevated above cards

  emerald: "#4D8963",            // success = accent
  destructive: "#C44031",        // web --destructive (6 60% 48%)
  warning: "#F4B870",
  info: "#6FA0D4",
};

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "netstart_theme_mode";

type ThemeContextValue = {
  mode: ThemeMode;
  theme: ThemePalette;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  loaded: boolean;
};

// Default to DARK so new users land in dark mode immediately. The
// AsyncStorage check overrides this with whatever the user previously
// chose (if anything).
const DEFAULT_MODE: ThemeMode = "dark";

const ThemeContext = createContext<ThemeContextValue>({
  mode: DEFAULT_MODE,
  theme: darkTheme,
  setMode: () => {},
  toggle: () => {},
  loaded: false,
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === "dark" || v === "light") setModeState(v);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme: mode === "dark" ? darkTheme : lightTheme,
      setMode,
      toggle,
      loaded,
    }),
    [mode, setMode, toggle, loaded],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
