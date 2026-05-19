"use client";
/**
 * Auth controls pinned to the top-right of the public homepage.
 *
 * Logged out: Sign in + Sign up pills.
 * Logged in:  user-name pill + Sign out button (routed through the
 *             app-wide confirm dialog so a single misclick can't
 *             drop the session).
 *
 * Hidden on mobile -- the IconRail + bottom CTAs already cover
 * those affordances on phone widths.
 */
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useConfirmSignOut } from "@/components/netstart/SignOutConfirm";
import { ThemeToggleButton } from "@/components/netstart/ThemeToggleButton";

const displayName = (
  user: { email?: string | null; user_metadata?: Record<string, unknown> } | null,
): string => {
  if (!user) return "you";
  const meta = user.user_metadata as { name?: string } | undefined;
  const raw = meta?.name?.trim() || user.email?.split("@")[0] || "you";
  const first = raw.split(/\s+/)[0] ?? raw;
  return first.length > 14 ? `${first.slice(0, 13)}â€¦` : first;
};

export const HomeAuthStrip = () => {
  const { user, loading } = useAuth();
  const confirmSignOut = useConfirmSignOut();

  // Don't flash a logged-out strip during auth hydration.
  if (loading) return null;

  return (
    <div className="hidden md:flex fixed top-4 right-5 z-40 items-center gap-2">
      {user ? (
        <>
          <span className="px-3 py-1.5 rounded-full border border-gold bg-gold text-[11px] font-mono uppercase tracking-[0.18em] text-white">
            {displayName(user)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void confirmSignOut()}
            className="font-mono text-[11px] uppercase tracking-[0.18em]"
          >
            Sign out
          </Button>
        </>
      ) : (
        <>
          <Link to="/signin">
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              Sign in
            </Button>
          </Link>
          <Link to="/signup">
            <Button
              variant="gold"
              size="sm"
              className="font-mono text-[11px] uppercase tracking-[0.18em]"
            >
              Sign up
            </Button>
          </Link>
        </>
      )}
      <ThemeToggleButton />
    </div>
  );
};
