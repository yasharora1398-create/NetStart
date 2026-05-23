"use client";
/**
 * Light/dark theme toggle. Shows a moon icon while we're in light
 * mode (click to switch to dark) and a sun icon while we're in
 * dark mode (click to switch to light). The icon itself sits in
 * the accent green; the surrounding pill has a faint gold-tinted
 * border so it reads as a button alongside the other top-bar pills.
 *
 * Used inside HomeAuthStrip on the marketing home and inside the
 * collapsed-sidebar floating bar.
 */
import { useTheme } from "@/hooks/useTheme";

export const ThemeToggleButton = () => {
 const { mode, toggle } = useTheme();
 const goingTo = mode === "dark" ? "light" : "dark";

 return (
 <button
 type="button"
 onClick={toggle}
 aria-label={`Switch to ${goingTo} mode`}
 title={`Switch to ${goingTo} mode`}
 className="flex h-8 w-8 items-center justify-center rounded-full border border-gold bg-gold text-white transition-colors hover:bg-gold"
 >
 {mode === "light" ? <MoonIcon /> : <SunIcon />}
 </button>
 );
};

const MoonIcon = () => (
 <svg
 width="14"
 height="14"
 viewBox="0 0 16 16"
 fill="none"
 stroke="currentColor"
 strokeWidth={1.5}
 strokeLinecap="round"
 strokeLinejoin="round"
 aria-hidden
 >
 <path d="M13 9.5 A5.5 5.5 0 1 1 6.5 3 A4.4 4.4 0 0 0 13 9.5 Z" />
 </svg>
);

const SunIcon = () => (
 <svg
 width="14"
 height="14"
 viewBox="0 0 16 16"
 fill="none"
 stroke="currentColor"
 strokeWidth={1.5}
 strokeLinecap="round"
 strokeLinejoin="round"
 aria-hidden
 >
 <circle cx="8" cy="8" r="3" />
 <path d="M8 1.5 V3 M8 13 V14.5 M1.5 8 H3 M13 8 H14.5 M3.4 3.4 L4.5 4.5 M11.5 11.5 L12.6 12.6 M3.4 12.6 L4.5 11.5 M11.5 4.5 L12.6 3.4" />
 </svg>
);
