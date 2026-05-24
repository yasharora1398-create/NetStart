"use client";
/**
 * Mobile home page. Rendered by [src/views/Home.tsx] at narrow
 * viewports (md:hidden); the desktop hero/sections still ship for
 * tablets and laptops.
 *
 * Shape:
 *   - top bar: Polln8 wordmark + hamburger that opens a nav sheet
 *     (Home / How it works / Standards / Sign in / Sign up)
 *   - hero: short pitch + one primary CTA -> /signin
 *     (when signed in the CTA flips to "Open the app" -> /m/)
 *   - 3 short sections explaining what Polln8 does
 *   - final CTA repeating the primary action
 *
 * The page is deliberately one-screen-tall on first paint so phone
 * users get the value prop + primary CTA without scrolling, then
 * the explainer sections appear as they scroll.
 */
import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggleButton } from "@/components/netstart/ThemeToggleButton";

type NavLink = { to: string; label: string };

const NAV_LINKS_GUEST: NavLink[] = [
  { to: "/", label: "Home" },
  { to: "/how", label: "How it works" },
  { to: "/standards", label: "The bar" },
  { to: "/signin", label: "Sign in" },
  { to: "/signup", label: "Sign up" },
];

const NAV_LINKS_AUTHED: NavLink[] = [
  { to: "/", label: "Home" },
  { to: "/how", label: "How it works" },
  { to: "/standards", label: "The bar" },
  { to: "/m/", label: "Open the app" },
];

const MobileHome = () => {
  const { user } = useAuth();
  const isAuthed = Boolean(user);
  const [navOpen, setNavOpen] = useState(false);

  // Lock body scroll while the nav sheet is open so the page behind
  // can't drift around under the user's thumb.
  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  const primaryCta = isAuthed
    ? { to: "/m/", label: "Open the app" }
    : { to: "/signin", label: "Sign in" };

  const navLinks = isAuthed ? NAV_LINKS_AUTHED : NAV_LINKS_GUEST;

  return (
    <div className="md:hidden min-h-dvh bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center justify-between px-5 h-14">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-lg tracking-[-0.02em] text-foreground"
          >
            <img
              src="/polln8-logo.png"
              alt=""
              className="h-7 w-7 object-contain"
              draggable={false}
            />
            Polln8
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={navOpen}
              aria-controls="mobile-nav"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pt-16 pb-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary mb-6">
          For founders + partners
        </p>
        <h1 className="font-display text-4xl leading-[1.05] tracking-[-0.025em] text-foreground mb-6 font-bold">
          Cofounders found efficiently.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground mb-10 max-w-prose">
          Polln8 is a private network of vetted founders and technical
          partners. Every profile is reviewed by a human, every chat
          starts with mutual interest, and the deck is ranked against
          what you actually want to build.
        </p>
        <Link
          to={primaryCta.to}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          {primaryCta.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
        {!isAuthed && (
          <Link
            to="/signup"
            className="inline-flex w-full items-center justify-center gap-2 mt-4 rounded-full border border-primary bg-transparent px-6 py-4 text-base font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Create an account
          </Link>
        )}
      </section>

      {/* What we do */}
      <section className="px-5 py-16 border-t border-border bg-card">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary mb-4">
          What Polln8 does
        </p>
        <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-foreground mb-6 font-bold">
          Match founders with the partner they need next to them.
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          Founders post the venture and the role they need filled.
          Partners build a profile that captures what they've shipped
          and what they want to ship next. We rank both sides against
          each other, vet every signup, and only open a chat when both
          sides accept.
        </p>
      </section>

      {/* How it works */}
      <section className="px-5 py-16 border-t border-border">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary mb-4">
          How it works
        </p>
        <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-foreground mb-8 font-bold">
          Three steps. Under a day to be in.
        </h2>
        <ol className="space-y-8">
          {[
            {
              n: "1",
              title: "Sign up + tell us who you are",
              body: "Founders post what they're building. Partners pick the projects worth shipping. Five minutes.",
            },
            {
              n: "2",
              title: "We review you",
              body: "A real person looks at every profile in under a day. We send you in or back with what's missing.",
            },
            {
              n: "3",
              title: "Match opens the moment you're in",
              body: "Swipe through the people we think fit you. Chat opens the second the other side accepts back.",
            },
          ].map((step) => (
            <li key={step.n} className="flex gap-4">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-bold">
                {step.n}
              </span>
              <div>
                <h3 className="font-display text-lg leading-tight text-foreground mb-1 font-semibold">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Standards */}
      <section className="px-5 py-16 border-t border-border bg-card">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary mb-4">
          The bar
        </p>
        <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-foreground mb-6 font-bold">
          Vetted, not viral.
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground mb-8">
          Every member is reviewed for shipped work, references, and a
          track record of execution. We grow through reputation, kept
          tight on purpose. The network shrinks if it has to.
        </p>
        <Link
          to="/standards"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary"
        >
          Read the standards
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* Final CTA */}
      <section className="px-5 py-20 border-t border-border">
        <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-foreground mb-6 font-bold text-center">
          {isAuthed ? "You're in. Open the app." : "Find the right person."}
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground text-center mb-10 max-w-prose mx-auto">
          {isAuthed
            ? "Jump into Match, edit MyNet, or check your chats."
            : "Sign in to start matching. Sign up if you're new."}
        </p>
        <Link
          to={primaryCta.to}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          {primaryCta.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <footer className="px-5 py-10 border-t border-border bg-card text-center">
        <p className="text-xs text-muted-foreground mb-3">
          © {new Date().getFullYear()} Polln8
        </p>
        <div className="flex items-center justify-center gap-4 text-xs">
          <Link to="/terms" className="text-muted-foreground hover:text-foreground">
            Terms
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
            Privacy
          </Link>
        </div>
      </footer>

      {/* Hamburger nav sheet */}
      {navOpen && (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-50 bg-background"
        >
          <div className="flex items-center justify-between px-5 h-14 border-b border-border">
            <span className="font-display text-lg tracking-[-0.02em] text-foreground">
              Menu
            </span>
            <button
              type="button"
              onClick={() => setNavOpen(false)}
              aria-label="Close navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="px-5 pt-6">
            <ul className="space-y-1">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    onClick={() => setNavOpen(false)}
                    className="flex items-center justify-between px-3 py-4 rounded-md text-base font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    {link.label}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default MobileHome;
