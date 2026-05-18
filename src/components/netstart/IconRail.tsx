/**
 * Thin left rail of icons for the public homepage. Replaces the
 * full sidebar on logged-out marketing surfaces where the wide
 * navigation panel is overkill and visually noisy.
 *
 * Each icon is a small button. Hover scales it up and slides a
 * label pill out to the right (tooltip-style), so users can
 * still see what each icon does without the rail eating any
 * horizontal real estate at rest.
 *
 * Hidden under md: at mobile widths the homepage relies on its
 * own bottom-anchored CTAs and the global MobileBottomNav, so
 * the rail just gets in the way.
 */
import { type ReactNode } from "react";
import { NavLink } from "@/lib/router-compat";
import {
  Bookmark,
  Compass,
  Download,
  Flower2,
  Home,
  MessageCircle,
  ShieldCheck,
  User,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

// Hardcoded admin gate: only the operator account at this address
// sees the Admin icon. Anyone else clicking /admin still hits the
// page's own isAdmin gate and gets redirected.
const ADMIN_EMAIL = "netstartapp@outlook.com";

type RailItem = {
  to: string;
  label: string;
  icon: ReactNode;
  /** Match exact route for active state (used by the Home link). */
  end?: boolean;
};

// Mirrors the desktop Sidebar's nav structure. Logged-out users
// who click an app route still hit it — the underlying page just
// renders its own AuthGate, which is the same affordance the
// Sidebar gives them.
const ITEMS: RailItem[] = [
  { to: "/", label: "Home", icon: <Home className="size-4" />, end: true },
  { to: "/mynet", label: "MyNet", icon: <User className="size-4" /> },
  { to: "/match", label: "Match", icon: <Flower2 className="size-4" /> },
  { to: "/saved", label: "Saved", icon: <Bookmark className="size-4" /> },
  { to: "/chats", label: "Chat", icon: <MessageCircle className="size-4" /> },
  {
    to: "/how",
    label: "How it works",
    icon: <Compass className="size-4" />,
  },
  {
    to: "/standards",
    label: "Standards",
    icon: <ShieldCheck className="size-4" />,
  },
  {
    to: "/download",
    label: "Download",
    icon: <Download className="size-4" />,
  },
];

export const IconRail = () => {
  const { user, loading } = useAuth();
  // Only treat the admin email as "the operator" once auth has
  // finished loading. Otherwise the admin icon pops in noticeably
  // ~200ms after the page paints, as the AuthContext rehydrates
  // the session from storage.
  const isAdminEmail =
    !loading &&
    (user?.email ?? "").toLowerCase() === ADMIN_EMAIL;
  // Admin item appended at the end so the operator's eye lands on it
  // last and the visual order of the public icons stays stable for
  // every other visitor.
  const items: RailItem[] = isAdminEmail
    ? [
        ...ITEMS,
        {
          to: "/admin",
          label: "Admin",
          icon: <Wrench className="size-4" />,
        },
      ]
    : ITEMS;

  return (
  <nav
    aria-label="Primary"
    className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 md:flex"
  >
    {items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          cn(
            "group relative flex h-11 w-11 items-center justify-center rounded-full border bg-card/80 backdrop-blur",
            "text-muted-foreground transition-all duration-200",
            "hover:scale-110 hover:bg-gold/10 hover:text-gold hover:border-gold/60 hover:shadow-[0_0_18px_hsl(var(--gold)/0.25)]",
            isActive
              ? "border-gold/60 bg-gold/10 text-gold shadow-[0_0_14px_hsl(var(--gold)/0.18)]"
              : "border-border",
          )
        }
      >
        {item.icon}
        {/* Tooltip — slides in from the icon's right edge on hover.
            Pointer-events disabled so it never blocks the click. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-full border border-gold/40 bg-card px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-foreground shadow-md",
            "opacity-0 -translate-x-1 transition-all duration-200",
            "group-hover:opacity-100 group-hover:translate-x-0",
          )}
        >
          {item.label}
        </span>
      </NavLink>
    ))}
  </nav>
  );
};
