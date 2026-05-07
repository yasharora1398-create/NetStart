/**
 * Polln8 marketing waitlist landing — served at "/" in production
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
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { StepMatch } from "@/components/mockups/Steps";

const Waitlist = () => {
  const { mode, toggle } = useTheme();

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-clip">
      {/* Soft blurred backdrop — a single forest-green orb that the
          hero copy floats over. Pure decoration, behind everything. */}
      <BlurredBackdrop />

      {/* Sticky top nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/50">
        <div className="mx-auto max-w-6xl px-5 md:px-8 h-14 md:h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl md:text-[22px] tracking-[-0.02em] text-foreground"
          >
            <img
              src="/polln8-logo.png"
              alt=""
              className="h-7 w-7 md:h-8 md:w-8 object-contain"
              draggable={false}
            />
            Polln8
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle mode={mode} onToggle={toggle} />
            <Link
              to="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO ----------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 md:px-8 pt-20 md:pt-28 pb-24 md:pb-40">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-16 items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-6">
                Coming soon · Free
              </p>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl leading-[0.95] tracking-[-0.035em] text-foreground mb-6">
                Stop building
                <br />
                alone.
              </h1>
              <p className="text-base sm:text-lg md:text-xl max-w-xl leading-relaxed text-muted-foreground mb-10">
                Solo founders quit. Teams ship. Polln8 is where founders find
                partners and builders find startups to bet on.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm md:text-base font-semibold text-primary-foreground transition-all hover:opacity-90 hover:gap-3"
                  style={{ boxShadow: "var(--shadow-glow)" }}
                >
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <p className="text-xs md:text-sm font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  Free · Launching 2026
                </p>
              </div>
            </div>

            {/* Right side — the Match step deck rendered with anonymous
                silhouettes (no specific people). The card info still
                shows so the visual reads as "this is the product."
                Hidden below lg so the headline owns the screen on
                phones/tablets. */}
            <div className="hidden lg:flex justify-center items-center scale-90 origin-center">
              <StepMatch anonymous />
            </div>
          </div>
        </section>

        {/* PROBLEM -------------------------------------------------- */}
        <Section eyebrow="The status quo">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-[-0.025em] leading-[1.05] text-foreground mb-10">
            The cofounder market is broken.
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-10 max-w-5xl">
            <Paragraph>
              Most founders try to find someone on Reddit or YC's matcher.
              They get idea-guys offering 5% equity for a full build.
              Engineers who ghost after one call. Forty platforms, all
              dumping grounds.
            </Paragraph>
            <Paragraph>
              The people you'd actually want to build with aren't on those
              platforms. They just don't know where to look.
            </Paragraph>
            <Paragraph>
              Most founders quit before they meet their person. The ones
              who don't ship faster, raise easier, and last longer.
            </Paragraph>
          </div>
        </Section>

        {/* HOW IT WORKS --------------------------------------------- */}
        <Section eyebrow="The mechanism">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-[-0.025em] leading-[1.05] text-foreground mb-12 md:mb-16">
            How Polln8 works.
          </h2>
          <div className="grid md:grid-cols-3 gap-10 md:gap-14">
            <Pillar
              accent="01"
              title="Founders post real ventures."
              body="Stage, what's built, equity offered. No vague ideas."
            />
            <Pillar
              accent="02"
              title="Builders show real work."
              body="Shipping history, skills, what they're looking for."
            />
            <Pillar
              accent="03"
              title="Equity is the contract."
              body="Stated up front. No surprises later."
            />
          </div>
        </Section>

        {/* WHO IT'S FOR --------------------------------------------- */}
        <Section eyebrow="Who it's for">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-[-0.025em] leading-[1.05] text-foreground mb-12 md:mb-16">
            Built for two sides.
          </h2>
          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            <RoleCard
              kind="Founders"
              tagline="You have a venture. You've built the foundation. You need someone in the trenches with you."
              signals={[
                "Has working product or clear traction",
                "Ready to give meaningful equity",
                "Committed to shipping",
              ]}
            />
            <RoleCard
              kind="Builders"
              tagline="You have skill. You have a job. You're ready to bet on something real."
              signals={[
                "Has shipping history",
                "Wants equity, not just salary",
                "Looking for a venture worth betting on",
              ]}
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
                Find your person.
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10">
                Polln8 launches 2026. Get on the list before then.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:opacity-90 hover:gap-3"
                  style={{ boxShadow: "var(--shadow-glow)" }}
                >
                  Get started
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
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
              © 2026 Polln8
            </p>
            <a
              href="https://x.com/polln8"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
            >
              @polln8
            </a>
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
}: {
  accent: string;
  title: string;
  body: string;
}) => (
  <article className="relative">
    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-4">
      {accent}
    </div>
    <div className="h-px w-12 bg-primary/40 mb-5" />
    <h3 className="font-display text-xl md:text-2xl tracking-[-0.02em] text-foreground mb-3">
      {title}
    </h3>
    <p className="text-sm md:text-[15px] leading-relaxed text-muted-foreground">
      {body}
    </p>
  </article>
);

const RoleCard = ({
  kind,
  tagline,
  signals,
}: {
  kind: string;
  tagline: string;
  signals: string[];
}) => (
  <article className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-7 md:p-9">
    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-4">
      {kind}
    </p>
    <p className="text-base md:text-lg leading-relaxed text-foreground mb-7">
      {tagline}
    </p>
    <ul className="space-y-3">
      {signals.map((s) => (
        <li key={s} className="flex items-start gap-3 text-sm text-muted-foreground">
          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  </article>
);

// ─── Decorative blurred backdrop ─────────────────────────────────
const BlurredBackdrop = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-0"
    style={{ filter: "blur(60px)" }}
  >
    {/* Top-right primary orb */}
    <div
      className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full opacity-30"
      style={{
        background:
          "radial-gradient(circle, hsl(var(--primary) / 0.85) 0%, transparent 70%)",
      }}
    />
    {/* Bottom-left soft accent orb */}
    <div
      className="absolute -bottom-40 -left-32 h-[520px] w-[520px] rounded-full opacity-25"
      style={{
        background:
          "radial-gradient(circle, hsl(var(--primary) / 0.7) 0%, transparent 70%)",
      }}
    />
  </div>
);

export default Waitlist;
