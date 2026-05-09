import { useCallback, useEffect, useState } from "react";

// Polln8 theme - toggles the `.dark` class on <html> and persists
// the pick to localStorage. Default is "dark" to match the mobile app.
//
// CSS variables in src/index.css drive the actual colors; this hook
// just flips the class so Tailwind / shadcn pick up the dark token set.

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "polln8_web_theme";

const readInitial = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
};

const applyMode = (mode: ThemeMode): void => {
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
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
