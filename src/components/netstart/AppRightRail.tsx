"use client";
/**
 * Desktop /app/ right rail. Thin vertical strip pinned to the far
 * right of the viewport with two icons: Match (the swipe deck) and
 * Profile (the user's own profile + everything that used to live in
 * the now-removed left sidebar: Settings, Sign out, Admin, Upgrade).
 *
 * Visual rules:
 *  - Active icon (route matches): solid green circle. "Green" =
 *    `bg-emerald-500 text-white` so it reads as primary-state
 *    without colliding with the gold/primary tokens used for paid
 *    or promo treatments.
 *  - Inactive: bordered outline only.
 *  - Hover: pill tooltip slides out to the LEFT (the rail is on
 *    the right edge, so the tooltip extends inward where there's
 *    room). Tooltip text: "Match" / "Your profile".
 *
 * Differentiation from Match-card action icons (skip / save / send
 * request): those use the X / Check / MessageCircle vocabulary and
 * sit inside the card. The rail icons use Flower2 + User and sit
 * outside the card on the page chrome, so the user reads them as
 * navigation rather than per-card actions.
 *
 * Sets --right-rail-width so AppLayout can pad the main column past
 * the rail. Desktop only; mobile uses MobileBottomNav.
 */
import { useEffect } from "react";
import { NavLink } from "@/lib/router-compat";
import { Flower2, Moon, Star, Sun, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

const RAIL_WIDTH = "64px";

type RailItem = {
 to: string;
 label: string;
 // Icon component (lucide-react). Stroke icons inherit color via
 // currentColor so active/inactive styling Just Works.
 icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const ITEMS: RailItem[] = [
 { to: "/app/match", label: "Match", icon: Flower2 },
 { to: "/app/profile", label: "Your profile", icon: User },
 // Reviews lives at the marketing root (/reviews), not under
 // /app/, because it's an About-style page. Linking to the
 // marketing path keeps a single canonical surface for it.
 { to: "/reviews", label: "Reviews", icon: Star },
];

export const AppRightRail = () => {
 // Hand the global layout a width to pad past. Cleared on unmount
 // so non-/app/ pages (marketing, signed-out) don't inherit the
 // offset.
 useEffect(() => {
 document.documentElement.style.setProperty(
 "--right-rail-width",
 RAIL_WIDTH,
 );
 return () => {
 document.documentElement.style.removeProperty("--right-rail-width");
 };
 }, []);

 return (
 <aside
 className="hidden md:flex fixed right-0 bottom-0 z-30 flex-col items-center gap-3 border-l border-border bg-card py-6"
 style={{
 width: RAIL_WIDTH,
 // Start below the profile-setup banner when it's
 // visible; falls back to 0 otherwise.
 top: "var(--profile-banner-height, 0px)",
 }}
 aria-label="Primary"
 >
 {ITEMS.map((item) => (
 <RailLink key={item.to} item={item} />
 ))}

 {/* Theme toggle pinned to the bottom-right corner of the
 viewport (which is just the bottom of this rail since the
 rail is the right edge). mt-auto pushes it past the nav
 items so the spacing between Reviews and the toggle grows
 to fill the rail. */}
 <ThemeToggleRail />
 </aside>
 );
};

// Theme toggle styled to match the rest of the rail's icon buttons
// (same h-11 w-11 circle, same hover behaviour, tooltip slides out
// to the left). Pinned to bottom via mt-auto on the wrapping span.
const ThemeToggleRail = () => {
 const { mode, toggle } = useTheme();
 const goingTo = mode === "dark" ? "light" : "dark";
 const Icon = mode === "dark" ? Sun : Moon;
 return (
 <button
 type="button"
 onClick={toggle}
 aria-label={`Switch to ${goingTo} mode`}
 className="group relative mt-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all duration-200 hover:border-emerald-500 hover:text-emerald-600"
 >
 <Icon className="h-4 w-4" strokeWidth={1.8} />
 <span
 aria-hidden
 className={cn(
 "pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-foreground shadow-md",
 "opacity-0 translate-x-1 transition-all duration-200",
 "group-hover:opacity-100 group-hover:translate-x-0",
 )}
 >
 {`Switch to ${goingTo}`}
 </span>
 </button>
 );
};

// Single rail entry. Renders a NavLink so the active state flows
// from the current route. Tooltip pill slides out to the LEFT on
// hover (the rail hugs the right viewport edge).
const RailLink = ({ item }: { item: RailItem }) => {
 const Icon = item.icon;
 return (
 <NavLink
 to={item.to}
 className={({ isActive }) =>
 cn(
 "group relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200",
 isActive
 ? "border-emerald-500 bg-emerald-500 text-white"
 : "border-border bg-background text-muted-foreground hover:border-emerald-500 hover:text-emerald-600",
 )
 }
 >
 <Icon className="h-4 w-4" strokeWidth={1.8} />
 {/* Hover tooltip - slides in from the right toward the
 cursor. Pinned to the LEFT of the icon because the rail
 itself is right-anchored. */}
 <span
 aria-hidden
 className={cn(
 "pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-foreground shadow-md",
 "opacity-0 translate-x-1 transition-all duration-200",
 "group-hover:opacity-100 group-hover:translate-x-0",
 )}
 >
 {item.label}
 </span>
 </NavLink>
 );
};
