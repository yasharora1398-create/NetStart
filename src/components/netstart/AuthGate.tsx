import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import { Lock, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * AuthGate has two modes:
 *
 *   • Standalone overlay (legacy): `<AuthGate />` floats above the
 *     current page. Used by /mynet, /match, /u/:id which manage
 *     their own visibility ({!loading && !user && <AuthGate />}).
 *
 *   • Wrapper (preferred for new pages): pass `authLoading`,
 *     `signedIn`, and optionally `needsSetup` plus children. The
 *     gate decides which of three things to render:
 *       – authLoading → a quiet placeholder (no flash of gate)
 *       – !signedIn   → "Members only" overlay with Sign in / Sign up
 *       – needsSetup  → "Finish setting up MyNet" overlay with a
 *                       single Go-to-MyNet CTA
 *       – otherwise   → children (the page itself)
 *
 * Copy can be overridden via `authTitle`/`authBody` (unauth state)
 * and `setupTitle`/`setupBody` (signed-in-but-pending state).
 */

type AuthGateProps = {
  // Wrapper-mode controls. If `children` is omitted, the gate runs
  // in standalone-overlay mode and these are ignored.
  authLoading?: boolean;
  signedIn?: boolean;
  needsSetup?: boolean;
  children?: ReactNode;

  // Copy overrides for either state.
  authTitle?: string;
  authBody?: string;
  setupTitle?: string;
  setupBody?: string;

  // Legacy aliases — old call sites use `title`/`body` to override
  // the unauth copy. Keep working.
  title?: string;
  body?: string;
};

const DEFAULT_AUTH_TITLE = "This is for members only.";
const DEFAULT_AUTH_BODY =
  "Sign in or create an account to use MyNet, save people, and run searches against your network.";
const DEFAULT_SETUP_TITLE = "Finish setting up MyNet.";
const DEFAULT_SETUP_BODY =
  "Your account is ready, but MyNet still needs your profile. Set it up so you can match, save, and chat.";

export const AuthGate = ({
  authLoading,
  signedIn,
  needsSetup,
  children,
  authTitle,
  authBody,
  setupTitle,
  setupBody,
  title,
  body,
}: AuthGateProps) => {
  // Wrapper mode: decide what to render based on auth/setup state.
  if (children !== undefined) {
    if (authLoading) return <>{children}</>;
    if (!signedIn) {
      return (
        <>
          {children}
          <Overlay
            variant="auth"
            title={authTitle ?? title ?? DEFAULT_AUTH_TITLE}
            body={authBody ?? body ?? DEFAULT_AUTH_BODY}
          />
        </>
      );
    }
    if (needsSetup) {
      return (
        <>
          {children}
          <Overlay
            variant="setup"
            title={setupTitle ?? DEFAULT_SETUP_TITLE}
            body={setupBody ?? DEFAULT_SETUP_BODY}
          />
        </>
      );
    }
    return <>{children}</>;
  }

  // Legacy standalone-overlay mode. Shows the unauth message with
  // optional title/body override (the way Match/MyNet/u call it).
  return (
    <Overlay
      variant="auth"
      title={authTitle ?? title ?? DEFAULT_AUTH_TITLE}
      body={authBody ?? body ?? DEFAULT_AUTH_BODY}
    />
  );
};

// ─── overlay ───────────────────────────────────────────────────────

type OverlayVariant = "auth" | "setup";

const Overlay = ({
  variant,
  title,
  body,
}: {
  variant: OverlayVariant;
  title: string;
  body: string;
}) => {
  const location = useLocation();
  const from = location.pathname + location.search;

  // /mynet (in production) doesn't render a sidebar, so hard-coding
  // `left: var(--sidebar-width)` would float the modal with an empty
  // bar on the left. Detect at runtime whether the var is set.
  const [hasSidebar, setHasSidebar] = useState(false);
  useEffect(() => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--sidebar-width")
      .trim();
    setHasSidebar(value.length > 0 && value !== "0px");
  }, []);

  const isAuth = variant === "auth";

  return (
    <div
      className="fixed top-0 right-0 bottom-0 z-30 flex items-center justify-center px-4"
      style={hasSidebar ? { left: "var(--sidebar-width)" } : { left: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
    >
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-md"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md rounded-sm border border-gold-soft bg-card shadow-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-spotlight opacity-60 pointer-events-none" />
        <div className="relative p-8 md:p-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold-soft bg-gold/5 mb-6">
            {isAuth ? (
              <Lock className="h-3 w-3 text-gold" />
            ) : (
              <Wrench className="h-3 w-3 text-gold" />
            )}
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gold">
              {isAuth ? "Members only" : "Setup needed"}
            </span>
          </div>

          <h2
            id="auth-gate-title"
            className="font-display text-3xl md:text-4xl leading-[1] mb-4"
          >
            {title}
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed mb-8">
            {body}
          </p>

          {isAuth ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/signin" state={{ from }} className="flex-1">
                <Button variant="outlineGold" size="lg" className="w-full h-12">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup" state={{ from }} className="flex-1">
                <Button variant="gold" size="lg" className="w-full h-12">
                  Sign up
                </Button>
              </Link>
            </div>
          ) : (
            <Link to="/mynet" className="block">
              <Button variant="gold" size="lg" className="w-full h-12">
                Go to MyNet
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-2 mt-8 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-gold" />
            {isAuth ? "Vetted builders only" : "One profile unlocks every tab"}
          </div>
        </div>
      </div>
    </div>
  );
};
