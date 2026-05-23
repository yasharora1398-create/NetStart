import { useCallback, useEffect, useState } from "react";

// Polln8 theme - toggles the `.dark` class on <html> and persists
// the pick to localStorage. Default is "light" - matches the mobile
// app's default and the marketing surfaces, which are designed light.
//
// CSS variables in src/index.css drive the actual colors; this hook
// just flips the class so Tailwind / shadcn pick up the dark token set.

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "polln8_web_theme";

const readInitial = (): ThemeMode => {
 if (typeof window === "undefined") return "light";
 const saved = window.localStorage.getItem(STORAGE_KEY);
 if (saved === "light" || saved === "dark") return saved;
 return "light";
};

// Hex versions of --background for each mode. Kept in sync with the
// HSL declarations in src/index.css. We need a raw colour string
// (not an HSL CSS var) so the <meta name="theme-color"> can be set
// - browser chrome / status-bar tint can't read CSS variables.
const BG_HEX: Record<ThemeMode, string> = {
 light: "#FAFAF7",
 dark: "#050505",
};

const applyMode = (mode: ThemeMode): void => {
 const root = document.documentElement;
 if (mode === "dark") root.classList.add("dark");
 else root.classList.remove("dark");

 // Sync the iOS / Android browser-chrome tint with the active
 // theme so the status bar and the area below the URL bar match
 // the app surface instead of flashing white.
 let meta = document.querySelector<HTMLMetaElement>(
 'meta[name="theme-color"]',
 );
 if (!meta) {
 meta = document.createElement("meta");
 meta.name = "theme-color";
 document.head.appendChild(meta);
 }
 meta.content = BG_HEX[mode];
};

export const useTheme = (): {
 mode: ThemeMode;
 toggle: () => void;
 setMode: (m: ThemeMode) => void;
} => {
 const [mode, setModeState] = useState<ThemeMode>(readInitial);

 // Apply on first render and on every change.
 useEffect(() => {
 applyMode(mode);
 window.localStorage.setItem(STORAGE_KEY, mode);
 }, [mode]);

 const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
 const toggle = useCallback(
 () => setModeState((m) => (m === "dark" ? "light" : "dark")),
 [],
 );

 return { mode, toggle, setMode };
};
