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
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Hammer,
  Heart,
  MapPin,
  Moon,
  Sparkles,
  Sun,
  Telescope,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { useInView } from "@/hooks/useInView";
import { useAuth } from "@/context/AuthContext";

type Persona = "founder" | "builder";

const Waitlist = () => {
  const { mode, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const [persona, setPersona] = useState<Persona>("founder");

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out.");
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-clip">
      {/* Soft blurred backdrop — a single forest-green orb that the
          hero copy floats over. Pure decoration, behind everything. */}
      <BlurredBackdrop />

      {/* Sticky top nav */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/50">
        <div className="mx-auto max-w-6xl px-5 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-xl md:text-[22px] tracking-[-0.02em] text-foreground"
          >
            <img
              src="/polln8-logo.png"
              alt=""
              className="h-11 w-11 md:h-14 md:w-14 object-contain"
              draggable={false}
            />
            Polln8
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
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
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-center">
            <div>
              {/* Persona toggle — flips the hero copy and the live
                  mockup below for whichever side of the network the
                  visitor is on. */}
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
                    <span className="text-primary italic">to bet on.</span>
                  </>
                )}
              </h1>
              <p className="text-base sm:text-lg md:text-xl max-w-xl leading-relaxed text-muted-foreground mb-10">
                {persona === "founder"
                  ? "Post your venture, set the equity, and meet vetted operators ranked by AI against what you're building. No talkers, no maybes."
                  : "Show your shipping history, pick what you'd actually bet on, and meet founders with real ventures and real equity. No spam, no maybes."}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/signup"
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

            <div className="hidden lg:flex justify-center">
              <HeroMockup persona={persona} />
            </div>
          </div>

          {/* Mobile mockup — placed below the hero copy on small
              screens so the visual still lands without crowding. */}
          <div className="lg:hidden mt-16 flex justify-center">
            <HeroMockup persona={persona} />
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
              They get pitched loose concepts in exchange for full builds
              and 5% equity. Engineers who ghost after one call. Forty
              platforms, all dumping grounds.
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
              details={[
                "Stage of the company: idea, prototype, MVP, or revenue.",
                "What's already shipped: product links, repos, traction.",
                "What you're looking for in a partner.",
                "Equity offered, stated up front.",
              ]}
            />
            <Pillar
              accent="02"
              title="Builders show real work."
              body="Shipping history, skills, what they're looking for."
              details={[
                "Verified resume or LinkedIn at signup.",
                "Shipping history with real product links, not buzzwords.",
                "Skills weighted by what you've actually used.",
                "Commitment level: full-time, evenings, weekends.",
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

          {/* Deeper dive — links to the full /how page. */}
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
              example={{
                headline:
                  "Climate fintech, pre-seed, looking for a senior backend engineer.",
                detail:
                  "Funded by an angel from Stripe. Need someone to lead the verification rails for carbon credits. Offering 8 to 15% equity.",
              }}
            />
            <RoleCard
              kind="Builders"
              tagline="You have skill. You have a job. You're ready to bet on something real."
              signals={[
                "Has shipping history",
                "Wants equity, not just salary",
                "Looking for a venture worth betting on",
              ]}
              example={{
                headline:
                  "Senior eng, ex-Stripe payments, four years on distributed systems.",
                detail:
                  "Strong in Rust and devtools. Wants to bet on a payments or infra startup with real customers. Open to full-time for the right equity.",
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
                Find your person.
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10">
                Polln8 launches August 2026. Get on the list before then.
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
}) => {
  // Reveal the details list automatically as the pillar scrolls into
  // view (no hover required). The closed-state pillar still takes
  // only the room its visible text needs, then expands once revealed.
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.4 });
  return (
    <article ref={ref} className="relative cursor-default">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary mb-4">
        {accent}
      </div>
      <div
        className={`h-px bg-primary/40 mb-5 transition-[width] duration-500 ${
          inView ? "w-20" : "w-12"
        }`}
      />
      <h3 className="font-display text-xl md:text-2xl tracking-[-0.02em] text-foreground mb-3">
        {title}
      </h3>
      <p className="text-sm md:text-[15px] leading-relaxed text-muted-foreground">
        {body}
      </p>
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-out ${
          inView ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <ul
            className={`space-y-2 border-l border-primary/30 pl-4 mt-5 transition-opacity duration-500 ${
              inView ? "opacity-100" : "opacity-0"
            }`}
            style={{ transitionDelay: inView ? "180ms" : "0ms" }}
          >
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
};

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
}) => {
  // Auto-reveal the example block as the card enters the viewport.
  // The card grows to fit; the page below shifts down naturally.
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.4 });
  return (
    <article
        ref={ref}
        className="self-start rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-7 md:p-9 transition-colors"
      >
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

        <div
          className={`grid transition-[grid-template-rows] duration-500 ease-out ${
            inView ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div
              className={`mt-6 pt-5 border-t border-primary/30 transition-opacity duration-500 ${
                inView ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: inView ? "200ms" : "0ms" }}
            >
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
};

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

// Linear-style hero artwork: a tilted phone-shaped frame with a
// stack of match cards inside, plus the three-action row below.
// Different deck per persona — founders see a stack of vetted
// operators, builders see a stack of real ventures with equity.
type CardData =
  | {
      kind: "operator";
      name: string;
      role: string;
      skills: string[];
      commitment: string;
      location: string;
    }
  | {
      kind: "project";
      title: string;
      stage: string;
      desc: string;
      equity: string;
      skills: string[];
    };

const FOUNDER_DECK: CardData[] = [
  {
    kind: "operator",
    name: "Maya Chen",
    role: "Senior backend · ex-Stripe",
    skills: ["Rust", "Distributed systems", "Payments"],
    commitment: "Full-time",
    location: "Remote · NA",
  },
  {
    kind: "operator",
    name: "Eitan Mor",
    role: "ML eng · ex-Anthropic",
    skills: ["LLMs", "Eval", "Infra"],
    commitment: "Full-time",
    location: "London",
  },
  {
    kind: "operator",
    name: "Priya Nayar",
    role: "Product eng · ex-Linear",
    skills: ["TypeScript", "Postgres", "DX"],
    commitment: "Part-time",
    location: "NYC",
  },
];

const BUILDER_DECK: CardData[] = [
  {
    kind: "project",
    title: "Climate fintech",
    stage: "Pre-seed · YC W26",
    desc: "Verification rails for carbon credits. Looking for a backend lead.",
    equity: "8–15%",
    skills: ["Rust", "Postgres", "Payments"],
  },
  {
    kind: "project",
    title: "Devtools observability",
    stage: "Seed · $2M raised",
    desc: "OSS tracing for serverless apps. Need a product engineer.",
    equity: "5–10%",
    skills: ["TypeScript", "OpenTelemetry"],
  },
  {
    kind: "project",
    title: "B2B AI workflows",
    stage: "Pre-seed · Idea",
    desc: "Agent system for sales operations. Looking for ML lead.",
    equity: "10–18%",
    skills: ["LLMs", "Eval", "Python"],
  },
];

const HeroMockup = ({ persona }: { persona: Persona }) => {
  const deck = persona === "founder" ? FOUNDER_DECK : BUILDER_DECK;
  // Cycle the front card every ~3.6s so the deck appears alive.
  const [front, setFront] = useState(0);
  useEffect(() => {
    const id = window.setInterval(
      () => setFront((f) => (f + 1) % deck.length),
      3600,
    );
    return () => window.clearInterval(id);
  }, [deck.length]);

  return (
    <div
      className="relative"
      style={{ perspective: "1200px" }}
      aria-hidden
    >
      {/* Phone frame */}
      <div
        className="relative w-[320px] h-[640px] rounded-[44px] border-[10px] border-foreground/85 bg-background shadow-2xl overflow-hidden"
        style={{
          transform: "rotateY(-8deg) rotateX(4deg)",
          transformStyle: "preserve-3d",
          boxShadow:
            "0 30px 60px -20px rgba(0,0,0,0.45), 0 18px 30px -10px rgba(0,0,0,0.3)",
        }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-28 bg-foreground/85 rounded-b-2xl z-30" />

        {/* Status row */}
        <div className="absolute top-2 left-0 right-0 flex items-center justify-between px-7 z-20 text-[10px] font-mono text-foreground/70 tracking-widest">
          <span>9:41</span>
          <span>polln8</span>
        </div>

        {/* Header */}
        <div className="absolute top-9 left-0 right-0 px-5 z-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {persona === "founder" ? "Operators · ranked" : "Projects · ranked"}
          </p>
        </div>

        {/* Card stack */}
        <div className="absolute inset-0 top-20 bottom-32 px-4">
          {deck.map((card, i) => {
            const offset = (i - front + deck.length) % deck.length;
            const isFront = offset === 0;
            return (
              <div
                key={i}
                className="absolute inset-x-4 top-0 bottom-0 rounded-2xl border border-border bg-card transition-all duration-700 ease-out"
                style={{
                  transform: `translateY(${offset * 6}px) translateX(${
                    offset * 4
                  }px) scale(${1 - offset * 0.04})`,
                  opacity: offset > 2 ? 0 : 1 - offset * 0.18,
                  zIndex: deck.length - offset,
                  boxShadow: isFront
                    ? "0 12px 32px -10px rgba(0,0,0,0.35)"
                    : "0 6px 18px -8px rgba(0,0,0,0.2)",
                }}
              >
                <DeckCardBody card={card} />
              </div>
            );
          })}
        </div>

        {/* Action row — the three-action signature of the deck. */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 z-20">
          <ActionPill icon={<X className="h-4 w-4" />} tone="muted" />
          <ActionPill icon={<Heart className="h-4 w-4" />} tone="muted" />
          <ActionPill icon={<ArrowRight className="h-4 w-4" />} tone="primary" />
        </div>
      </div>

      {/* Floating "ranked by AI" chip — small detail that signals
          the differentiator without an extra section. */}
      <div
        className="absolute -left-6 top-16 rounded-full border border-border bg-card/95 backdrop-blur px-3 py-1.5 shadow-lg flex items-center gap-1.5"
        style={{ transform: "rotate(-6deg)" }}
      >
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-foreground">
          Ranked by AI
        </span>
      </div>
    </div>
  );
};

const DeckCardBody = ({ card }: { card: CardData }) => {
  if (card.kind === "operator") {
    return (
      <div className="h-full flex flex-col p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-11 w-11 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary">
            <BadgeCheck className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-base text-foreground truncate">
              {card.name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {card.role}
            </p>
          </div>
        </div>
        <div className="space-y-2.5 mt-1">
          <Detail icon={<Briefcase className="h-3 w-3" />} label={card.commitment} />
          <Detail icon={<MapPin className="h-3 w-3" />} label={card.location} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {card.skills.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 text-[10px] rounded-sm border border-primary/30 bg-primary/5 text-foreground"
            >
              {s}
            </span>
          ))}
        </div>
        <div className="mt-auto pt-3 border-t border-border flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            96% match · ranked
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-2">
        {card.stage}
      </p>
      <p className="font-display text-base text-foreground mb-2 leading-tight">
        {card.title}
      </p>
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
        {card.desc}
      </p>
      <div className="flex flex-wrap gap-1 mb-3">
        {card.skills.map((s) => (
          <span
            key={s}
            className="px-2 py-0.5 text-[10px] rounded-sm border border-primary/30 bg-primary/5 text-foreground"
          >
            {s}
          </span>
        ))}
      </div>
      <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Equity
        </span>
        <span className="text-[11px] font-medium text-foreground">
          {card.equity}
        </span>
      </div>
    </div>
  );
};

const Detail = ({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) => (
  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
    <span className="text-primary">{icon}</span>
    {label}
  </div>
);

const ActionPill = ({
  icon,
  tone,
}: {
  icon: React.ReactNode;
  tone: "muted" | "primary";
}) => (
  <div
    className={`h-10 w-10 rounded-full flex items-center justify-center border ${
      tone === "primary"
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-card text-muted-foreground border-border"
    }`}
  >
    {icon}
  </div>
);

// ─── Decorative blurred backdrop ─────────────────────────────────
const BlurredBackdrop = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-0"
    style={{ filter: "blur(80px)" }}
  >
    {/* Top-right primary orb — dimmed so the homepage reads as black
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
