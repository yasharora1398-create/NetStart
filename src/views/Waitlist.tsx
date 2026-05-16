"use client";
/**
 * Polln8 marketing waitlist landing - served at "/" in production
 * (Vercel) only. On localhost the original Index page renders instead
 * so the live product keeps iterating untouched. The routing switch
 * lives in App.tsx (`import.meta.env.PROD`).
 *
 * Single continuous scroll, mobile-first, restrained. Uses the app's
 * forest-green / sage palette via the CSS variables in index.css so
 * it lives in the same brand as the rest of the app.
 *
 * Light/dark is class-based on <html>. The circular sun/moon button
 * in the top-right of the sticky nav drives `useTheme()`.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  ArrowRight,
  Hammer,
  Moon,
  Sun,
  Telescope,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/context/AuthContext";
import { useConfirmSignOut } from "@/components/netstart/SignOutConfirm";
import { logPageView } from "@/lib/analytics";
import WhySection from "@/components/marketing/WhySection";

type Persona = "founder" | "builder";

const Waitlist = () => {
  usePageMeta({
    title: "Polln8 | Find a Cofounder or a Startup to Join",
    description:
      "Find a cofounder, or find a startup to join. Polln8 matches founders with vetted technical cofounders and founding engineers, and matches builders with early-stage startups worth joining.",
    path: "/",
  });
  const { mode, toggle } = useTheme();
  const { user, isAdmin } = useAuth();
  const confirmSignOut = useConfirmSignOut();
  const [persona, setPersona] = useState<Persona>("founder");

  // Routed through the shared confirm dialog so a stray click on
  // "Sign out" in the nav doesn't drop the session without warning.
  const handleSignOut = () => confirmSignOut();

  // Log one unique view per device per day. The migration's
  // (device_id, day) primary key collapses repeat hits to a no-op.
  useEffect(() => {
    void logPageView();
  }, []);

  // Shrink the sticky nav once the user has scrolled past the hero,
  // expand it back when they're near the top. The two thresholds
  // create a deadband (hysteresis) so the flicker loop can't trigger:
  // when the nav collapses, content reflows up by ~16-24px and
  // scrollY drops; with a single threshold that immediately re-
  // expands the nav, which pushes content back, etc. The 60px gap
  // between thresholds (140 collapse / 80 expand) means a single
  // short scroll can't cross both directions in one frame.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setScrolled((prev) => {
        const y = window.scrollY;
        if (!prev && y > 140) return true;
        if (prev && y < 80) return false;
        return prev;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-clip">
      {/* Soft blurred backdrop - a single forest-green orb that the
          hero copy floats over. Pure decoration, behind everything. */}
      <BlurredBackdrop />

      {/* Sticky top nav - follows the scroll, collapses to a thinner
          strip once the user has moved past the hero. */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-[background-color,border-color,box-shadow] duration-200 ${
          scrolled
            ? "bg-background/85 border-border/70 shadow-sm"
            : "bg-background/70 border-border/50"
        }`}
      >
        <div
          className={`mx-auto max-w-6xl px-5 md:px-8 flex items-center justify-between transition-[height] duration-200 ${
            scrolled ? "h-12 md:h-14" : "h-16 md:h-20"
          }`}
        >
          <Link
            to="/"
            className={`flex items-center gap-2 font-display tracking-[-0.02em] text-foreground transition-[font-size] duration-200 ${
              scrolled ? "text-base md:text-lg" : "text-xl md:text-[22px]"
            }`}
          >
            <img
              src="/polln8-logo.png"
              alt=""
              className={`object-contain transition-[width,height] duration-200 ${
                scrolled
                  ? "h-7 w-7 md:h-9 md:w-9"
                  : "h-11 w-11 md:h-14 md:w-14"
              }`}
              draggable={false}
            />
            Polln8
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
            {/* Admin-only link to the dashboard. Hidden for everyone
                else. The /admin page itself also gates on isAdmin. */}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-sm font-medium text-primary transition-opacity hover:opacity-80"
              >
                Admin
              </Link>
            )}
            {/* If the user is already authenticated, the SignUp/SignIn
                pages auto-redirect them back here, which feels like
                the auth pages are broken. Show a "Sign out" link
                instead so they can drop the session and re-test. */}
            {user ? (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/signin"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
            )}
            <ThemeToggle mode={mode} onToggle={toggle} />
            {user ? (
              <Link
                to="/mynet"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Edit MyNet
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO ----------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 md:px-8 pt-16 md:pt-24 pb-20 md:pb-32">
          <div>
            {/* Persona toggle - flips the hero copy for whichever
                side of the network the visitor is on. */}
            <PersonaToggle persona={persona} onChange={setPersona} />

            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-5 mt-8">
              {persona === "founder"
                ? "For founders · Free"
                : "For builders · Free"}
            </p>
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[6.25rem] leading-[0.95] tracking-[-0.035em] text-foreground mb-6">
              {persona === "founder" ? (
                <>
                  Find your
                  <br />
                  <span className="text-primary italic">co-founder.</span>
                </>
              ) : (
                <>
                  Find a startup
                  <br />
                  <span className="text-primary italic">to cofound.</span>
                </>
              )}
            </h1>
            <p className="text-base sm:text-lg md:text-xl max-w-xl leading-relaxed text-muted-foreground mb-10">
              {persona === "founder"
                ? "Cofounder matchmaking for serious startups. Post your venture, set the equity, and meet vetted technical cofounders and founding engineers ranked by AI against what you're building. Quality candidates only."
                : "Cofounder matchmaking for serious builders. Show your shipping history, find an early-stage startup worth joining as a cofounder or founding engineer, and meet founders with real ventures and real equity."}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={user ? "/mynet" : "/signup"}
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm md:text-base font-semibold text-primary-foreground transition-all hover:opacity-90 hover:gap-3"
                style={{ boxShadow: "var(--shadow-glow)" }}
              >
                {persona === "founder"
                  ? "Post a project"
                  : "Set up your profile"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="text-xs md:text-sm font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Free · Launching August 2026
              </p>
            </div>
          </div>
        </section>

        {/* PROBLEM -------------------------------------------------- */}
        <Section eyebrow="The status quo">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-[-0.025em] leading-[1.05] text-foreground mb-10">
            Finding a cofounder is broken.
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-10 max-w-5xl">
            <Paragraph>
              Most founders search for a technical cofounder on Reddit or
              YC's matcher. They review loose concepts in exchange for full
              builds and 5% equity, talk to engineers who stop responding
              after one call, and rotate through dozens of cofounder dating
              platforms with no signal.
            </Paragraph>
            <Paragraph>
              The quality candidates you'd actually want to build a startup
              with aren't on those platforms. They just don't know where to
              look.
            </Paragraph>
            <Paragraph>
              Most founders quit before they meet their cofounder. The ones
              who don't ship faster, raise easier, and last longer.
            </Paragraph>
          </div>
        </Section>

        {/* HOW IT WORKS --------------------------------------------- */}
        <Section eyebrow="The mechanism">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-[-0.025em] leading-[1.05] text-foreground mb-12 md:mb-16">
            How cofounder matchmaking works on Polln8.
          </h2>
          <div className="grid md:grid-cols-3 gap-10 md:gap-14">
            <Pillar
              accent="01"
              title="Founders post real startups."
              body="Stage, what's built, equity offered. No vague ideas, no spec work."
              details={[
                "Stage of the startup: idea, prototype, MVP, or revenue.",
                "What's already shipped: product links, repos, traction.",
                "Whether you need a technical cofounder, founding engineer, or builder.",
                "Equity offered, stated up front.",
              ]}
            />
            <Pillar
              accent="02"
              title="Builders show real work."
              body="Shipping history, skills, what they're looking to cofound."
              details={[
                "Verified resume or LinkedIn at signup.",
                "Shipping history with real product links, not buzzwords.",
                "Skills weighted by what you've actually used.",
                "Commitment level: full-time cofounder, founding engineer, evenings, weekends.",
              ]}
            />
            <Pillar
              accent="03"
              title="Equity is the contract."
              body="Stated up front. No surprises later."
              details={[
                "Founders set equity ranges before any conversation.",
                "Vesting and cliff are surfaced on the project card.",
                "No bait-and-switch on terms after weeks of meetings.",
                "What you see on the card is what you sign.",
              ]}
            />
          </div>

          {/* Deeper dive - links to the full /how page. */}
          <div className="mt-12 md:mt-16">
            <Link
              to="/how"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent"
            >
              See the full flow
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Section>

        {/* WHY - three reasons in a zig-zag layout. Animated mockups
            visible on lg+ only; phones see the text in a frosted card. */}
        <WhySection persona={persona} />

        {/* WHO IT'S FOR --------------------------------------------- */}
        <Section eyebrow="Who it's for">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-[-0.025em] leading-[1.05] text-foreground mb-12 md:mb-16">
            Built for serious founders and builders.
          </h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            <RoleCard
              kind="Founders"
              tagline="You have a startup. You've built the foundation. You need a cofounder in the trenches with you."
              signals={[
                "Has working product or clear traction",
                "Ready to give meaningful equity",
                "Looking for a technical cofounder or founding engineer",
              ]}
              example={{
                headline:
                  "Climate fintech, pre-seed, looking for a technical cofounder.",
                detail:
                  "Funded by an angel from Stripe. Need a senior backend engineer to lead the verification rails for carbon credits. Offering 8 to 15% equity.",
              }}
            />
            <RoleCard
              kind="Builders"
              tagline="You have skill. You have a job. You're ready to cofound something real."
              signals={[
                "Has shipping history",
                "Wants equity, not just salary",
                "Looking for a startup worth cofounding",
              ]}
              example={{
                headline:
                  "Senior eng, ex-Stripe payments, four years on distributed systems.",
                detail:
                  "Strong in Rust and devtools. Wants to join a payments or infra startup as a founding engineer. Open to full-time for the right equity.",
              }}
            />
          </div>
        </Section>

        {/* CLOSING CTA ---------------------------------------------- */}
        <section className="relative mx-auto max-w-6xl px-5 md:px-8 pt-20 md:pt-32 pb-24 md:pb-32">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-16 md:px-16 md:py-24 text-center">
            {/* Subtle radial glow only on this panel */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, hsl(var(--primary) / 0.18), transparent 65%)",
              }}
            />
            <div className="relative">
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-[-0.03em] leading-[1] text-foreground mb-5">
                Find your cofounder.
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10">
                Polln8 is cofounder matchmaking for early-stage startups.
                Launching August 2026. Get on the list before then.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to={user ? "/mynet" : "/signup"}
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90 hover:gap-3"
                  style={{ boxShadow: "var(--shadow-glow)" }}
                >
                  {user ? "Edit MyNet" : "Get started"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  Free · No credit card
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER --------------------------------------------------- */}
        <footer className="mx-auto max-w-6xl px-5 md:px-8 pb-10 pt-6 border-t border-border/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-display text-sm tracking-[-0.01em] text-foreground">
              Polln8
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
              <Link
                to="/terms"
                className="transition-colors hover:text-foreground"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="transition-colors hover:text-foreground"
              >
                Privacy
              </Link>
              <a
                href="mailto:Polln8app@outlook.com"
                className="transition-colors hover:text-foreground normal-case tracking-normal"
              >
                Polln8app@outlook.com
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/polln8"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
              >
                @polln8
              </a>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
                © {new Date().getFullYear()} Polln8
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

// ─── Theme toggle: a circular button that swaps sun ↔ moon ───────
const ThemeToggle = ({
  mode,
  onToggle,
}: {
  mode: "light" | "dark";
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent"
  >
    {mode === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    )}
  </button>
);

// ─── Section wrapper with eyebrow + reveal-on-scroll ──────────────
const Section = ({
  eyebrow,
  children,
}: {
  eyebrow?: string;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("reveal-on");
        });
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <section className="mx-auto max-w-6xl px-5 md:px-8 py-20 md:py-32">
      <div ref={ref} className="reveal">
        {eyebrow ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-4">
            {eyebrow}
          </p>
        ) : null}
        {children}
      </div>
    </section>
  );
};

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[15px] md:text-base leading-[1.65] text-muted-foreground">
    {children}
  </p>
);

const Pillar = ({
  accent,
  title,
  body,
  details,
}: {
  accent: string;
  title: string;
  body: string;
  details: string[];
}) => (
  <article className="group relative cursor-default">
    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-4">
      {accent}
    </div>
    <div className="h-px w-12 bg-primary/40 mb-5 transition-[width] duration-500 group-hover:w-20" />
    <h3 className="font-display text-xl md:text-2xl tracking-[-0.02em] text-foreground mb-3">
      {title}
    </h3>
    <p className="text-sm md:text-[15px] leading-relaxed text-muted-foreground">
      {body}
    </p>
    <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-hover:grid-rows-[1fr]">
      <div className="overflow-hidden">
        <ul className="space-y-2 border-l border-primary/30 pl-4 mt-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:delay-200">
          {details.map((d) => (
            <li
              key={d}
              className="text-sm leading-relaxed text-muted-foreground"
            >
              {d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </article>
);

const RoleCard = ({
  kind,
  tagline,
  signals,
  example,
}: {
  kind: string;
  tagline: string;
  signals: string[];
  example: { headline: string; detail: string };
}) => (
  <article className="group self-start rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-7 md:p-9 transition-colors">
    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-4">
      {kind}
    </p>
    <p className="text-base md:text-lg leading-relaxed text-foreground mb-7">
      {tagline}
    </p>
    <ul className="space-y-3">
      {signals.map((s) => (
        <li
          key={s}
          className="flex items-start gap-3 text-sm text-muted-foreground"
        >
          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
          <span>{s}</span>
        </li>
      ))}
    </ul>

    <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-hover:grid-rows-[1fr]">
      <div className="overflow-hidden">
        <div className="mt-6 pt-5 border-t border-primary/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:delay-200">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-2">
            Example
          </p>
          <p className="text-foreground font-semibold leading-snug">
            {example.headline}
          </p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {example.detail}
          </p>
        </div>
      </div>
    </div>
  </article>
);

// ─── Hero: persona toggle + product mockup ──────────────────────
// Cal.com-style segmented switch. Two pills, the active one swaps
// to the gold (primary) treatment and the inactive sits flat. The
// thumb slides via translate-x so the motion reads as one control,
// not two buttons.
const PersonaToggle = ({
  persona,
  onChange,
}: {
  persona: Persona;
  onChange: (p: Persona) => void;
}) => (
  <div
    className="relative inline-flex items-center rounded-full border border-border bg-card/60 p-1"
    role="group"
    aria-label="I am a"
  >
    <span
      className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-primary transition-transform duration-300 ease-out"
      style={{
        transform: persona === "founder" ? "translateX(0)" : "translateX(100%)",
        boxShadow: "var(--shadow-glow)",
      }}
      aria-hidden
    />
    <button
      type="button"
      onClick={() => onChange("founder")}
      aria-pressed={persona === "founder"}
      className={`relative z-10 inline-flex items-center gap-2 px-5 py-2 text-sm font-medium transition-colors ${
        persona === "founder"
          ? "text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Hammer className="h-3.5 w-3.5" />
      I'm a founder
    </button>
    <button
      type="button"
      onClick={() => onChange("builder")}
      aria-pressed={persona === "builder"}
      className={`relative z-10 inline-flex items-center gap-2 px-5 py-2 text-sm font-medium transition-colors ${
        persona === "builder"
          ? "text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Telescope className="h-3.5 w-3.5" />
      I'm a builder
    </button>
  </div>
);

// ─── Decorative blurred backdrop ─────────────────────────────────
const BlurredBackdrop = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-0"
    style={{ filter: "blur(80px)" }}
  >
    {/* Top-right primary orb - dimmed so the homepage reads as black
        first, green-accented second. */}
    <div
      className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full opacity-[0.10] dark:opacity-[0.10]"
      style={{
        background:
          "radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)",
      }}
    />
    {/* Bottom-left soft accent orb */}
    <div
      className="absolute -bottom-40 -left-32 h-[520px] w-[520px] rounded-full opacity-[0.08] dark:opacity-[0.08]"
      style={{
        background:
          "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)",
      }}
    />
  </div>
);

export default Waitlist;
