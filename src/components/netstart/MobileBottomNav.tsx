/**
 * Mobile-only bottom tab bar. Four tabs (Match / Saved / Chat /
 * MyNet) that mirror the IA of the native mobile app, so the web
 * experience on a phone matches what a user expects from the app.
 *
 * Collapsable: the chevron pushes the bar off the right edge of
 * the screen so the user can take a full-screen look at the
 * underlying page. A small floating chevron appears in the
 * bottom-right corner to bring it back. State persists across
 * reloads via localStorage so the user's preference sticks.
 *
 * Safe-area padding (env(safe-area-inset-*)) keeps the bar above
 * the home indicator on iOS without overlapping the page content.
 */
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Target,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "polln8.mobile_nav.collapsed";

type Tab = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TABS: Tab[] = [
  { to: "/match", label: "Match", icon: Target },
  { to: "/saved", label: "Saved", icon: Bookmark },
  { to: "/chats", label: "Chat", icon: MessageCircle },
  { to: "/mynet", label: "MyNet", icon: User },
];

export const MobileBottomNav = () => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  });

  useEffect(() => {
    window.localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <>
      {/* The bar itself — translates off the right edge when
          collapsed. Stays mounted so the slide animation runs both
          directions; pointer-events disabled while hidden so it
          doesn't catch taps. */}
      <nav
        aria-label="Primary"
        className={cn(
          "fixed inset-x-3 z-40 md:hidden",
          "bottom-3",
          "rounded-2xl border border-border bg-card/95 shadow-lg",
          "backdrop-blur supports-[backdrop-filter]:bg-card/80",
          "transition-transform duration-300 ease-out",
          collapsed
            ? "pointer-events-none translate-x-[calc(100%+1rem)]"
            : "translate-x-0",
        )}
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
        }}
      >
        <div className="flex items-stretch">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-mono uppercase tracking-[0.15em] transition-colors",
                  isActive
                    ? "text-gold"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <t.icon className="h-5 w-5" />
              <span>{t.label}</span>
            </NavLink>
          ))}
          {/* Collapse handle — chevron sitting on the trailing edge
              of the bar, separated by a hairline so it reads as a
              distinct affordance, not a fifth tab. */}
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Hide navigation"
            className="flex w-10 items-center justify-center border-l border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Restore handle — only visible when the bar is collapsed.
          Floats above the page content, same safe-area awareness
          as the bar so it never sits under the home indicator. */}
      {collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Show navigation"
          className="fixed right-3 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/95 text-gold shadow-lg backdrop-blur transition-colors hover:bg-card md:hidden"
          style={{
            bottom: "calc(max(env(safe-area-inset-bottom), 0px) + 0.75rem)",
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
    </>
  );
};
