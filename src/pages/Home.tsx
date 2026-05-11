/**
 * Public marketing homepage. The product is hidden from a fresh
 * visitor in two ways elsewhere. Most of the app is auth-gated,
 * /mynet is the post-signup landing. So this page has one job:
 * convince a stranger they should put their email in the form.
 *
 * Structure: hero, problem, proof, role split, social proof, how
 * it works, explore grid, FAQ, final CTA. Each section sits inside
 * a FadeUp so the page accumulates momentum as the user scrolls.
 * Tone is direct, not hype-y.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Check,
  Compass,
  Download,
  Flame,
  Hammer,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Telescope,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/netstart/Footer";
import { IconRail } from "@/components/netstart/IconRail";
import { FadeUp } from "@/components/netstart/FadeUp";
import WhySection from "@/components/marketing/WhySection";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const Home = () => {
  // Keep useTheme mounted so the rest of the app respects the
  // light/dark choice the user picked previously even though
  // this page doesn't expose its own theme toggle.
  useTheme();

  return (
    <div className="min-h-dvh bg-background text-foreground overflow-x-clip">
      <IconRail />

      <main className="md:pl-20">
        <Hero />
        <Problem />
        {/* Proof: three live mockup rows showing review,
            ranked matches, and the chat request flow. Replaces
            a static "what's different" cards row with something
            users can actually look at. */}
        <ProofIntro />
        <WhySection />
        <RoleSplit />
        <SocialProof />
        <HowItWorks />
        <ExploreGrid />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
};

// ───────────────────────────────────────────────────────────────
// SHARED INTERACTIVE PRIMITIVES
// ───────────────────────────────────────────────────────────────

// Magnetic: pulls its contents toward the cursor on hover. Skips
// reduced-motion and coarse-pointer (touch) devices so it never
// fights with tap targets. Used on the biggest CTAs.
const Magnetic = ({
  children,
  strength = 8,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    };
    const onLeave = () => {
      el.style.transform = "";
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);
  return (
    <span
      ref={ref}
      className={cn(
        "inline-block transition-transform duration-300 ease-out will-change-transform",
        className,
      )}
    >
      {children}
    </span>
  );
};

// TiltCard: 3D perspective tilt that tracks the cursor across
// the card. Eased via rAF so it doesn't twitch. Includes a
// cursor-following highlight overlay that picks up the gold tint.
// No-ops on touch + reduced-motion.
const TiltCard = ({
  children,
  className,
  intensity = 6,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    let tX = 0;
    let tY = 0;
    let cX = 0;
    let cY = 0;
    let gx = 50;
    let gy = 50;

    const tick = () => {
      cX += (tX - cX) * 0.14;
      cY += (tY - cY) * 0.14;
      el.style.transform = `perspective(900px) rotateY(${cX}deg) rotateX(${-cY}deg)`;
      el.style.setProperty("--gx", `${gx}%`);
      el.style.setProperty("--gy", `${gy}%`);
      if (Math.abs(tX - cX) > 0.05 || Math.abs(tY - cY) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      tX = nx * intensity;
      tY = ny * intensity;
      gx = (nx + 0.5) * 100;
      gy = (ny + 0.5) * 100;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      tX = 0;
      tY = 0;
      gx = 50;
      gy = 50;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [intensity]);

  return (
    <div
      ref={ref}
      className={cn(
        "relative will-change-transform [transform-style:preserve-3d]",
        className,
      )}
      style={
        {
          "--gx": "50%",
          "--gy": "50%",
        } as React.CSSProperties
      }
    >
      {children}
      {glare && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-sm opacity-0 transition-opacity duration-300 [.group:hover_&]:opacity-100 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at var(--gx) var(--gy), hsl(var(--gold) / 0.12), transparent 65%)",
          }}
        />
      )}
    </div>
  );
};

// CountUp: animates a number from 0 to target when it enters the
// viewport. Eased cubic-out so it lands on the value gracefully
// instead of crawling at the end.
const CountUp = ({
  target,
  prefix = "",
  suffix = "",
  duration = 1400,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(Math.round(target * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, duration]);
  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
};

// ───────────────────────────────────────────────────────────────
// HERO
// ───────────────────────────────────────────────────────────────
// Title is split into words so each one can stagger-in on mount.
// "show up" carries the gold accent so the eye lands on the
// verb phrase that actually carries the meaning of the page.
const HERO_WORDS: Array<{ text: string; gold?: boolean }> = [
  { text: "Cofounders" },
  { text: "who" },
  { text: "show", gold: true },
  { text: "up.", gold: true },
];

const Hero = () => {
  // Auth-aware CTAs: signed-in users shouldn't see "Sign up" buttons
  // (clicking them used to bounce them back to home). They get the
  // "Open MyNet" variant instead.
  const { user } = useAuth();
  const isAuthed = !!user;

  // Word-by-word fade on first paint. Tiny mount timer so the
  // first frame renders in the hidden state, otherwise React
  // can paint already-visible and skip the transition.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setMounted(true);
      return;
    }
    const t = window.setTimeout(() => setMounted(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  // Cursor-following gold glow. We write CSS variables on the
  // section element so the gradient layer below can read them
  // without React re-rendering on every mousemove.
  const sectionRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative px-4 sm:px-8 pt-24 pb-32 md:pt-32 md:pb-40"
      style={
        {
          "--mx": "50%",
          "--my": "-10%",
        } as React.CSSProperties
      }
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-70 transition-[background] duration-700 ease-out"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at var(--mx) var(--my), hsl(var(--gold) / 0.22), transparent 60%)",
        }}
      />

      {/* Decorative grid lines behind the hero. Pure CSS, parallax
          drift on cursor courtesy of the same --mx/--my variables. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--gold)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          backgroundPosition: "calc(var(--mx) * -0.05) calc(var(--my) * -0.05)",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 75%)",
        }}
      />

      <div className="mx-auto max-w-5xl">
        <FadeUp>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/5 px-3 py-1.5">
            <Sparkles className="h-3 w-3 text-gold animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
              Cofounder matchmaking, with signal
            </span>
          </div>
        </FadeUp>

        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-tight mb-6">
          {HERO_WORDS.flatMap((w, i) => {
            const word = (
              <span
                key={i}
                className={cn(
                  "inline-block transition-all duration-700 ease-out",
                  mounted
                    ? "opacity-100 translate-y-0 blur-0"
                    : "opacity-0 translate-y-6 blur-sm",
                )}
                style={{
                  transitionDelay: mounted ? `${120 + i * 90}ms` : "0ms",
                }}
              >
                <span
                  className={
                    w.gold ? "text-gradient-gold not-italic" : undefined
                  }
                >
                  {w.text}
                </span>
              </span>
            );
            // Inter-word space lives as a sibling text node in the
            // h1 instead of inside the animated inline-block. That
            // way the space is never clipped at the edge of the block
            // (which is what was making the title render as one word).
            return i < HERO_WORDS.length - 1 ? [word, " "] : [word];
          })}
        </h1>

        <FadeUp delay={520}>
          <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
            Polln8 matches vetted founders with technical operators serious
            enough to build alongside them. Every profile is reviewed. Every
            chat is mutual. No swipe-spam, no ghosting. Just the five people
            you'd actually want to talk to this week.
          </p>
        </FadeUp>

        <FadeUp delay={600}>
          <div className="flex flex-wrap items-center gap-3">
            <Magnetic strength={10}>
              <Link to={isAuthed ? "/mynet" : "/signup"}>
                <Button variant="gold" size="xl" className="group">
                  {isAuthed ? "Open MyNet" : "Get started"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </Magnetic>
            <Magnetic strength={6}>
              <Link to={isAuthed ? "/match" : "/how"}>
                <Button variant="outlineGold" size="xl">
                  {isAuthed ? "Open Match" : "How it works"}
                </Button>
              </Link>
            </Magnetic>
            <Link
              to={isAuthed ? "/saved" : "/match"}
              className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-gold transition-colors inline-flex items-center gap-1.5"
            >
              {isAuthed ? "Your saved candidates" : "Or peek at the deck"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </FadeUp>

        <FadeUp delay={680}>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-gold" />
              Reviewed in &lt;24h
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-gold" />
              No DM spam
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-gold" />
              Equity-aligned only
            </span>
          </div>
        </FadeUp>
      </div>
    </section>
  );
};

// ───────────────────────────────────────────────────────────────
// PROBLEM
// ───────────────────────────────────────────────────────────────
const Problem = () => {
  const items = [
    {
      icon: <X className="h-5 w-5 text-destructive" />,
      title: "Twitter DMs into the void",
      body: "Founders cold-message strangers on X. Half get ignored. The other half get one reply and then silence after the 'sounds cool, let's chat' moment.",
    },
    {
      icon: <X className="h-5 w-5 text-destructive" />,
      title: "Networking events full of consultants",
      body: "Three-hour meetups in WeWork basements. You leave with a stack of cards from people pitching services, not teammates.",
    },
    {
      icon: <X className="h-5 w-5 text-destructive" />,
      title: "Random matchmaking lotteries",
      body: "YC's cofounder match drops you next to 2,000 strangers sorted by a coarse filter. You scroll for an hour and tap five people who never reply.",
    },
  ];

  return (
    <section className="relative border-y border-border bg-card/40 px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <FadeUp>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
            What's broken
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-12 max-w-3xl leading-[1.05]">
            Finding a cofounder is a coin flip with worse odds than a startup.
          </h2>
        </FadeUp>

        <div className="grid gap-4 md:grid-cols-3">
          {items.map((it, i) => (
            <FadeUp key={it.title} delay={i * 80}>
              <TiltCard intensity={5} className="group h-full">
                <article className="relative h-full rounded-sm border border-border bg-background p-6 transition-colors group-hover:border-gold/40">
                  <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-sm border border-destructive/30 bg-destructive/5 transition-transform group-hover:rotate-6 group-hover:scale-110">
                    {it.icon}
                  </div>
                  <h3 className="font-display text-xl mb-2 leading-tight">
                    {it.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {it.body}
                  </p>
                </article>
              </TiltCard>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
};

// ───────────────────────────────────────────────────────────────
// PROOF INTRO: header that precedes the live WhySection mockups.
// The mockups themselves carry the visual proof; this is just
// the lead-in so the section doesn't start abruptly.
// ───────────────────────────────────────────────────────────────
const ProofIntro = () => (
  <section className="px-4 sm:px-8 pt-24 md:pt-32 pb-0">
    <div className="mx-auto max-w-5xl">
      <FadeUp>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
          What you actually see
        </p>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-4 max-w-3xl leading-[1.05]">
          Three screens that do most of the work.
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          A reviewer screen so every member gets vetted. A ranked deck so
          you see signal, not feed-spam. A request that has to be accepted
          before chat opens. The rest of the app exists to keep these three
          clean.
        </p>
      </FadeUp>
    </div>
  </section>
);

// ───────────────────────────────────────────────────────────────
// ROLE SPLIT: for founders / for builders
// ───────────────────────────────────────────────────────────────
const RoleSplit = () => {
  const { user } = useAuth();
  const isAuthed = !!user;
  return (
  <section className="relative border-y border-border bg-gradient-to-b from-card/40 via-background to-card/40 px-4 sm:px-8 py-24 md:py-32">
    <div className="mx-auto max-w-6xl">
      <FadeUp>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3 text-center">
          Pick the side you're on
        </p>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-12 text-center leading-[1.05]">
          Same network, two angles.
        </h2>
      </FadeUp>

      <div className="grid gap-5 md:grid-cols-2">
        <FadeUp>
          <TiltCard intensity={4} className="group h-full">
            <article className="relative h-full rounded-sm border border-border bg-background/80 p-8 transition-colors group-hover:border-gold/60">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-sm border border-gold/40 bg-gold/10 text-gold transition-transform group-hover:scale-110 group-hover:-rotate-3">
                <Hammer className="h-6 w-6" />
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
                I'm a founder
              </p>
              <h3 className="font-display text-3xl mb-4 leading-tight">
                Stop pitching strangers.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Post what you're building once. We surface operators whose
                skills and commitment actually match. Not a thousand "ML
                enthusiasts" with side projects.
              </p>
              <ul className="space-y-2.5 mb-7">
                <BulletItem>One pitch covers every introduction</BulletItem>
                <BulletItem>Builders with shipped work, not just bios</BulletItem>
                <BulletItem>Block the noise. Accept only the ones you want</BulletItem>
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <Magnetic strength={6}>
                  <Link to={isAuthed ? "/mynet" : "/signup"}>
                    <Button variant="gold" size="lg" className="group/btn">
                      {isAuthed ? "Edit your project" : "Post a project"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </Magnetic>
                <Link
                  to="/standards"
                  className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-gold transition-colors inline-flex items-center gap-1.5"
                >
                  Read the bar
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          </TiltCard>
        </FadeUp>

        <FadeUp delay={120}>
          <TiltCard intensity={4} className="group h-full">
            <article className="relative h-full rounded-sm border border-border bg-background/80 p-8 transition-colors group-hover:border-gold/60">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-sm border border-gold/40 bg-gold/10 text-gold transition-transform group-hover:scale-110 group-hover:rotate-3">
                <Telescope className="h-6 w-6" />
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
                I'm a builder
              </p>
              <h3 className="font-display text-3xl mb-4 leading-tight">
                See real projects. Not job boards.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Swipe through what founders are actually building right now.
                See stage, traction, equity ask, and what they need. Pitch
                once when something fits, and only to people who can hear it.
              </p>
              <ul className="space-y-2.5 mb-7">
                <BulletItem>Browse projects, not LinkedIn job titles</BulletItem>
                <BulletItem>Mutual interest before any commitment</BulletItem>
                <BulletItem>Save the ones that intrigue you, ignore the rest</BulletItem>
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <Magnetic strength={6}>
                  <Link to={isAuthed ? "/match" : "/signup"}>
                    <Button variant="gold" size="lg" className="group/btn">
                      {isAuthed ? "Open Match" : "Find a project"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </Magnetic>
                <Link
                  to="/saved"
                  className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-gold transition-colors inline-flex items-center gap-1.5"
                >
                  Your saved
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          </TiltCard>
        </FadeUp>
      </div>
    </div>
  </section>
  );
};

const BulletItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2.5 text-sm">
    <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gold/10">
      <Check className="h-2.5 w-2.5 text-gold" strokeWidth={3} />
    </span>
    <span className="text-foreground/90 leading-relaxed">{children}</span>
  </li>
);

// ───────────────────────────────────────────────────────────────
// SOCIAL PROOF
// ───────────────────────────────────────────────────────────────
const SocialProof = () => {
  // Each stat has both an animated number (CountUp) and a blur-clear
  // container reveal. The combination feels like the value is locking
  // into focus instead of just appearing.
  const stats = [
    { value: 100, prefix: "", suffix: "%", label: "Reviewed by a human" },
    { value: 24, prefix: "<", suffix: "h", label: "Average review time" },
    { value: 2, prefix: "", suffix: "", label: "Messages before they have to accept" },
    { value: 0, prefix: "", suffix: "", label: "Recruiters allowed" },
  ];

  const rowRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="px-4 sm:px-8 py-20 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div
          ref={rowRef}
          className="grid gap-6 md:grid-cols-4 text-center"
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "group cursor-default transition-all duration-700 ease-out",
                visible
                  ? "opacity-100 translate-y-0 blur-0"
                  : "opacity-0 translate-y-3 blur-md",
              )}
              style={{
                transitionDelay: visible ? `${i * 110}ms` : "0ms",
              }}
            >
              <p className="font-display text-5xl md:text-6xl text-gold mb-2 leading-none transition-transform group-hover:scale-105 group-hover:drop-shadow-[0_0_14px_hsl(var(--gold)/0.45)]">
                <CountUp
                  target={s.value}
                  prefix={s.prefix}
                  suffix={s.suffix}
                />
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ───────────────────────────────────────────────────────────────
// HOW IT WORKS
// ───────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const { user } = useAuth();
  const isAuthed = !!user;
  const steps = [
    {
      n: "01",
      title: "Sign up + tell us who you are",
      body: "Founders post what they're building. Builders pick the kinds of projects they'd want to ship. Five minutes, no friction.",
    },
    {
      n: "02",
      title: "We review you",
      body: "A real person looks at every profile in under a day. We send you in or send you back with what's missing. No bots, no waitlist purgatory.",
    },
    {
      n: "03",
      title: "Match starts the moment you're in",
      body: "Swipe through the people we think fit you. Accept the ones who feel right. Chat opens the second the other side accepts back.",
    },
  ];

  return (
    <section className="border-y border-border bg-card/40 px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <FadeUp>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
            How it works
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-12 max-w-3xl leading-[1.05]">
            Three steps. No back-and-forth before your first real match.
          </h2>
        </FadeUp>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <FadeUp key={s.n} delay={i * 100}>
              <TiltCard intensity={3} glare={false} className="group h-full">
                <article className="h-full rounded-sm border border-border bg-background p-7 transition-colors group-hover:border-gold/40">
                  <p className="font-mono text-4xl text-gold mb-4 tracking-[0.18em] transition-all group-hover:tracking-[0.3em] group-hover:drop-shadow-[0_0_12px_hsl(var(--gold)/0.5)]">
                    {s.n}
                  </p>
                  <h3 className="font-display text-xl mb-3 leading-tight">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.body}
                  </p>
                </article>
              </TiltCard>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={400}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Magnetic strength={6}>
              <Link to={isAuthed ? "/mynet" : "/signup"}>
                <Button variant="gold" size="lg" className="group/btn">
                  {isAuthed ? "Go to MyNet" : "Start step one"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </Magnetic>
            <Link
              to="/how"
              className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-gold transition-colors inline-flex items-center gap-1.5"
            >
              See the full walkthrough
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
};

// ───────────────────────────────────────────────────────────────
// EXPLORE GRID: a buffet of internal pages. Every tile is a real
// link into a real page. Auth-gated pages render their own
// AuthGate when clicked, so the rail and the grid are both safe
// to expose to logged-out visitors.
// ───────────────────────────────────────────────────────────────
const ExploreGrid = () => {
  const { user } = useAuth();
  const isAuthed = !!user;
  // Swap the auth-only tiles based on whether the visitor is signed
  // in. Without this, signed-in users clicking "Sign up" or "Sign in"
  // bounce back to this same page.
  const tiles: Array<{
    to: string;
    icon: ReactNode;
    title: string;
    body: string;
    cta: string;
  }> = [
    isAuthed
      ? {
          to: "/mynet",
          icon: <Sparkles className="h-5 w-5" />,
          title: "Your MyNet",
          body: "Edit your profile, projects, and connections.",
          cta: "Open MyNet",
        }
      : {
          to: "/signup",
          icon: <Sparkles className="h-5 w-5" />,
          title: "Get verified",
          body: "Submit your profile. We review in under 24 hours.",
          cta: "Sign up",
        },
    {
      to: "/match",
      icon: <Flame className="h-5 w-5" />,
      title: "Browse the deck",
      body: "Swipe through founders and the projects they're building.",
      cta: "Open Match",
    },
    {
      to: "/saved",
      icon: <Bookmark className="h-5 w-5" />,
      title: "Saved candidates",
      body: "Your bookmarked matches in one place.",
      cta: "View saved",
    },
    {
      to: "/chats",
      icon: <MessageCircle className="h-5 w-5" />,
      title: "Conversations",
      body: "Mutual matches unlock chat. No DM spam.",
      cta: "Open chats",
    },
    {
      to: "/standards",
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "The bar",
      body: "What every member commits to before joining.",
      cta: "Read standards",
    },
    {
      to: "/how",
      icon: <Compass className="h-5 w-5" />,
      title: "How it works",
      body: "Three minutes, end to end. No surprises.",
      cta: "See the flow",
    },
    {
      to: "/download",
      icon: <Download className="h-5 w-5" />,
      title: "Mobile",
      body: "Swipe matches on your phone. iOS + Android.",
      cta: "Download",
    },
    isAuthed
      ? {
          to: "/settings",
          icon: <User className="h-5 w-5" />,
          title: "Settings",
          body: "Manage your account, theme, and sign-out.",
          cta: "Open settings",
        }
      : {
          to: "/signin",
          icon: <User className="h-5 w-5" />,
          title: "Already in?",
          body: "Sign in to your existing account.",
          cta: "Sign in",
        },
  ];

  return (
    <section className="px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
            Where to next
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-3 max-w-3xl leading-[1.05]">
            Every door is unlocked.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-12">
            Click anything. The pages that need your identity prompt you
            when you try to act, not when you try to look.
          </p>
        </FadeUp>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t, i) => (
            <FadeUp key={t.to + t.title} delay={(i % 4) * 70}>
              <TiltCard intensity={5} className="group h-full">
                <Link
                  to={t.to}
                  className="relative block h-full rounded-sm border border-border bg-card/60 p-5 transition-colors hover:border-gold/60 hover:bg-card"
                >
                  <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-sm border border-gold/40 bg-gold/10 text-gold transition-transform group-hover:scale-110 group-hover:rotate-6">
                    {t.icon}
                  </div>
                  <h3 className="font-display text-lg mb-1.5 leading-tight">
                    {t.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {t.body}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.2em] text-gold">
                    {t.cta}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </TiltCard>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
};

// ───────────────────────────────────────────────────────────────
// FAQ
// ───────────────────────────────────────────────────────────────
const FAQ = () => {
  const items = [
    {
      q: "Do I need a fully-formed startup to join?",
      a: "No. If you have a clear idea, a problem you've been working on, or a project with one paying user, you're in. We're not for tire-kickers, but you don't need a polished deck either.",
    },
    {
      q: "What if I'm a builder, not a founder?",
      a: "That's most of our community. You don't need a startup or an idea, just the skills and the appetite to join one. You browse projects the same way founders browse builders.",
    },
    {
      q: "How long does review take?",
      a: "Usually under 24 hours. If we need more info we'll tell you what's missing instead of sitting on your application.",
    },
    {
      q: "Is it free?",
      a: "Yes, for now. We may charge later, likely for premium discovery or extra messaging, but the core network stays free for everyone who's been vetted in.",
    },
  ];

  return (
    <section className="px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        <FadeUp>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
            FAQ
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-10 leading-[1.05]">
            The short version of every email we get.
          </h2>
        </FadeUp>

        <div className="space-y-4">
          {items.map((it, i) => (
            <FadeUp key={it.q} delay={i * 60}>
              <details className="group rounded-sm border border-border bg-card hover:border-gold/40 transition-colors">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4">
                  <span className="font-medium text-foreground">{it.q}</span>
                  <span className="font-mono text-xs text-gold transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {it.a}
                </p>
              </details>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={300}>
          <p className="mt-10 text-center text-xs font-mono uppercase tracking-[0.22em] text-muted-foreground">
            Still wondering?{" "}
            <Link to="/how" className="text-gold hover:underline">
              See how it works
            </Link>
            {" · "}
            <Link to="/standards" className="text-gold hover:underline">
              Read the standards
            </Link>
          </p>
        </FadeUp>
      </div>
    </section>
  );
};

// ───────────────────────────────────────────────────────────────
// FINAL CTA
// ───────────────────────────────────────────────────────────────
const FinalCTA = () => {
  const { user } = useAuth();
  const isAuthed = !!user;
  return (
  <section className="relative border-t border-border bg-gradient-to-b from-card/40 to-background px-4 sm:px-8 py-32 md:py-40">
    <div
      aria-hidden
      className="absolute inset-0 -z-10"
      style={{
        background:
          "radial-gradient(ellipse 60% 60% at 50% 50%, hsl(var(--gold) / 0.12), transparent 70%)",
      }}
    />
    <div className="mx-auto max-w-3xl text-center">
      <FadeUp>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.02] tracking-tight mb-6">
          Build something{" "}
          <em className="not-italic text-gradient-gold">real</em>. With the
          right person.
        </h2>
        <p className="text-muted-foreground text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Five minutes to sign up. A day to get reviewed. Then it's just
          you and the people who can actually move the thing forward.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Magnetic strength={10}>
            <Link to={isAuthed ? "/mynet" : "/signup"}>
              <Button variant="gold" size="xl" className="group">
                {isAuthed ? "Open MyNet" : "Get started"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </Magnetic>
          <Magnetic strength={4}>
            <Link to={isAuthed ? "/match" : "/signin"}>
              <Button variant="ghost" size="xl">
                {isAuthed ? "Open Match" : "I already have an account"}
              </Button>
            </Link>
          </Magnetic>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          <Link to="/how" className="hover:text-gold transition-colors">
            How it works
          </Link>
          <Link to="/standards" className="hover:text-gold transition-colors">
            Standards
          </Link>
          <Link to="/download" className="hover:text-gold transition-colors">
            Download
          </Link>
          <Link to="/match" className="hover:text-gold transition-colors">
            Browse the deck
          </Link>
          {isAuthed && (
            <Link to="/settings" className="hover:text-gold transition-colors">
              Settings
            </Link>
          )}
        </div>
      </FadeUp>
    </div>
  </section>
  );
};

export default Home;
