"use client";
/**
 * Marketing homepage. One purpose: get a stranger to sign up.
 *
 * Structure: hero, problem, proof-mockups (WhySection), role split,
 * stats, how-it-works, explore grid, FAQ, final CTA.
 *
 * Interactive flourishes that stay on purpose - they make the site
 * feel high-tech without being template-y once paired with the
 * rewritten conversational copy:
 *   - Cursor-following gold glow on the hero
 *   - Parallax grid lines under the hero
 *   - Per-word stagger reveal on the headline
 *   - Magnetic CTAs (gently pulled toward the cursor)
 *   - TiltCard 3D hover on the cards
 *   - CountUp on the four-stat row
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/netstart/Footer";
import { IconRail } from "@/components/netstart/IconRail";
import { HomeAuthStrip } from "@/components/netstart/HomeAuthStrip";
import { FadeUp } from "@/components/netstart/FadeUp";
import WhySection from "@/components/marketing/WhySection";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// Magnetic: pulls its contents toward the cursor on hover. Skips
// reduced-motion and coarse-pointer (touch) devices so it never
// fights with tap targets.
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

// TiltCard: 3D perspective tilt that tracks the cursor across the
// card. Eased via rAF. No-ops on touch + reduced-motion.
const TiltCard = ({
  children,
  className,
  intensity = 6,
}: {
  children: ReactNode;
  className?: string;
  intensity?: number;
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
    const tick = () => {
      cX += (tX - cX) * 0.14;
      cY += (tY - cY) * 0.14;
      el.style.transform = `perspective(900px) rotateY(${cX}deg) rotateX(${-cY}deg)`;
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
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      tX = 0;
      tY = 0;
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
    >
      {children}
    </div>
  );
};

// CountUp: animates a number from 0 to target when its containing
// row enters the viewport. Eased cubic-out so the value lands on
// the target rather than crawling at the end. Respects
// prefers-reduced-motion.
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

// Hero headline split per word so each can stagger-in on mount.
const HERO_WORDS: string[] = ["Cofounders", "found", "efficiently."];

const Home = () => {
  // Keeps the theme toggle's choice respected even though this page
  // doesn't expose its own theme control.
  useTheme();

  return (
    <div className="min-h-dvh bg-background text-foreground overflow-x-clip">
      <IconRail />
      <HomeAuthStrip />

      <main className="md:pl-20">
        <Hero />
        <Problem />
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

// ─── HERO ──────────────────────────────────────────────────────────
const Hero = () => {
  const { user } = useAuth();
  const isAuthed = !!user;

  // Per-word fade on first paint. Default to mounted=true so the
  // SSR'd HTML has visible text (Googlebot reads SSR output for
  // its snippet, and opacity-0 spans were hiding the headline).
  // On the client we briefly toggle to hidden so the animation
  // still plays after hydration.
  const [mounted, setMounted] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    setMounted(false);
    const t = window.setTimeout(() => setMounted(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  // Cursor-following glow + parallax grid. We write CSS variables
  // on the section so the gradient + grid background can read them
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
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-tight mb-6 font-bold">
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
                  transitionDelay: mounted ? `${120 + i * 110}ms` : "0ms",
                }}
              >
                {w}
              </span>
            );
            // The inter-word space sits as a sibling text node so it
            // isn't clipped at the edge of the animated inline-block.
            return i < HERO_WORDS.length - 1 ? [word, " "] : [word];
          })}
        </h1>

        <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
          Polln8 is a private network of vetted founders and technical
          builders. Every profile is reviewed by a human, every chat
          starts with mutual interest, and the deck is ranked against
          what you actually want to build.
        </p>

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
            className="text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            {isAuthed ? "Your saved candidates" : "Or peek at the deck"}
          </Link>
        </div>
      </div>
    </section>
  );
};

// ─── PROBLEM ───────────────────────────────────────────────────────
const Problem = () => {
  const items = [
    {
      title: "Twitter DMs into the void",
      body: "Cold-message strangers on X. Half get ignored. The other half reply once and then go quiet.",
    },
    {
      title: "Networking events full of consultants",
      body: "WeWork basements at 7pm. You leave with cards from people pitching services, not teammates.",
    },
    {
      title: "Random matchmaking lotteries",
      body: "YC's matcher drops you next to 2,000 strangers sorted by a coarse filter. You tap five who never reply.",
    },
  ];

  return (
    <section className="relative border-y border-border bg-card/40 px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-12 max-w-3xl leading-[1.05] font-bold">
          Finding a cofounder is a coin flip with worse odds than a startup.
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {items.map((it) => (
            <TiltCard key={it.title} intensity={5} className="group h-full">
              <article className="relative h-full rounded-sm border border-border bg-background p-6 transition-colors group-hover:border-gold">
                <h3 className="font-display text-xl mb-2 leading-tight font-semibold">
                  {it.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {it.body}
                </p>
              </article>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── PROOF INTRO ───────────────────────────────────────────────────
const ProofIntro = () => (
  <section className="px-4 sm:px-8 pt-24 md:pt-32 pb-0">
    <div className="mx-auto max-w-5xl">
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-4 max-w-3xl leading-[1.05] font-bold">
        Three screens that do most of the work.
      </h2>
      <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
        A reviewer screen so every member gets vetted. A ranked deck so
        you see signal, not feed-spam. A request that has to be accepted
        before chat opens. The rest of the app exists to keep these three
        clean.
      </p>
    </div>
  </section>
);

// ─── ROLE SPLIT ────────────────────────────────────────────────────
const RoleSplit = () => {
  const { user } = useAuth();
  const isAuthed = !!user;
  return (
    <section className="relative border-y border-border bg-card/40 px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-12 text-center leading-[1.05] font-bold">
          Same network, two angles.
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <TiltCard intensity={4} className="group h-full">
            <article className="relative h-full rounded-sm border border-border bg-background/80 p-8 transition-colors group-hover:border-gold">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold mb-3">
                I'm a founder
              </p>
              <h3 className="font-display text-3xl mb-4 leading-tight font-semibold">
                Pitch one person, the right one.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Post what you're building once. We surface builders whose
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
                  className="text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  Read the bar
                </Link>
              </div>
            </article>
          </TiltCard>

          <TiltCard intensity={4} className="group h-full">
            <article className="relative h-full rounded-sm border border-border bg-background/80 p-8 transition-colors group-hover:border-gold">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold mb-3">
                I'm a builder
              </p>
              <h3 className="font-display text-3xl mb-4 leading-tight font-semibold">
                See real projects. Not job boards.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Swipe through what founders are actually building right now.
                Stage, traction, equity ask, what they need. Pitch once when
                something fits, and only to people who can hear it.
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
                  className="text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  Your saved
                </Link>
              </div>
            </article>
          </TiltCard>
        </div>
      </div>
    </section>
  );
};

const BulletItem = ({ children }: { children: React.ReactNode }) => (
  <li className="text-sm text-foreground/90 leading-relaxed">{children}</li>
);

// ─── SOCIAL PROOF ──────────────────────────────────────────────────
// Four hard numbers in a row. Each fades in with a slight blur
// clear as the section enters the viewport; the numbers themselves
// count from zero to value (CountUp).
const SocialProof = () => {
  const stats: { value: number; prefix: string; suffix: string; label: string }[] = [
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
                "transition-all duration-700 ease-out",
                visible
                  ? "opacity-100 translate-y-0 blur-0"
                  : "opacity-0 translate-y-3 blur-md",
              )}
              style={{
                transitionDelay: visible ? `${i * 110}ms` : "0ms",
              }}
            >
              <p className="font-display text-5xl md:text-6xl text-gold mb-2 leading-none font-bold">
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

// ─── HOW IT WORKS ──────────────────────────────────────────────────
const HowItWorks = () => {
  const { user } = useAuth();
  const isAuthed = !!user;
  const steps = [
    {
      n: "1",
      title: "Sign up + tell us who you are",
      body: "Founders post what they're building. Builders pick the kinds of projects they'd want to ship. Five minutes.",
    },
    {
      n: "2",
      title: "We review you",
      body: "A real person looks at every profile in under a day. We send you in or send you back with what's missing.",
    },
    {
      n: "3",
      title: "Match starts the moment you're in",
      body: "Swipe through the people we think fit you. Accept the ones who feel right. Chat opens the second the other side accepts back.",
    },
  ];

  return (
    <section className="border-y border-border bg-card/40 px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-12 max-w-3xl leading-[1.05] font-bold">
          Three steps. No back-and-forth before your first real match.
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <TiltCard key={s.n} intensity={3} className="group h-full">
              <article className="h-full rounded-sm border border-border bg-background p-7 transition-colors group-hover:border-gold">
                <p className="font-display text-5xl font-bold text-gold mb-4 leading-none">
                  {s.n}
                </p>
                <h3 className="font-display text-xl mb-3 leading-tight font-semibold">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.body}
                </p>
              </article>
            </TiltCard>
          ))}
        </div>

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
            className="text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            See the full walkthrough
          </Link>
        </div>
      </div>
    </section>
  );
};

// ─── EXPLORE GRID ──────────────────────────────────────────────────
const ExploreGrid = () => {
  const { user } = useAuth();
  const isAuthed = !!user;
  const tiles: Array<{
    to: string;
    title: string;
    body: string;
    cta: string;
  }> = [
    isAuthed
      ? {
          to: "/mynet",
          title: "Your MyNet",
          body: "Edit your profile, projects, and connections.",
          cta: "Open MyNet",
        }
      : {
          to: "/signup",
          title: "Get verified",
          body: "Submit your profile. We review in under 24 hours.",
          cta: "Sign up",
        },
    {
      to: "/match",
      title: "Browse the deck",
      body: "Swipe through founders and the projects they're building.",
      cta: "Open Match",
    },
    {
      to: "/saved",
      title: "Saved candidates",
      body: "Your bookmarked matches in one place.",
      cta: "View saved",
    },
    {
      to: "/chats",
      title: "Conversations",
      body: "Mutual matches unlock chat. No DM spam.",
      cta: "Open chats",
    },
    {
      to: "/standards",
      title: "The bar",
      body: "What every member commits to before joining.",
      cta: "Read standards",
    },
    {
      to: "/how",
      title: "How it works",
      body: "Three minutes, end to end. No surprises.",
      cta: "See the flow",
    },
    {
      to: "/download",
      title: "Mobile",
      body: "Swipe matches on your phone. iOS + Android.",
      cta: "Download",
    },
    isAuthed
      ? {
          to: "/settings",
          title: "Settings",
          body: "Manage your account, theme, and sign-out.",
          cta: "Open settings",
        }
      : {
          to: "/signin",
          title: "Already in?",
          body: "Sign in to your existing account.",
          cta: "Sign in",
        },
  ];

  return (
    <section className="px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-3 max-w-3xl leading-[1.05] font-bold">
          Every door is unlocked.
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-12">
          Click anything. The pages that need your identity prompt you
          when you try to act, not when you try to look.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t) => (
            <TiltCard key={t.to + t.title} intensity={5} className="group h-full">
              <Link
                to={t.to}
                className="relative block h-full rounded-sm border border-border bg-card/60 p-5 transition-colors hover:border-gold hover:bg-card"
              >
                <h3 className="font-display text-lg mb-1.5 leading-tight font-semibold">
                  {t.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  {t.body}
                </p>
                <span className="inline-flex items-center text-sm font-semibold text-gold">
                  {t.cta}
                </span>
              </Link>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── FAQ ───────────────────────────────────────────────────────────
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
      a: "Yes. Polln8 is free.",
    },
  ];

  return (
    <section className="px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-10 leading-[1.05] font-bold">
          The short version of every email we get.
        </h2>

        <div className="space-y-4">
          {items.map((it) => (
            <details
              key={it.q}
              className="group rounded-sm border border-border bg-card hover:border-gold transition-colors"
            >
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
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Still wondering?{" "}
          <Link to="/how" className="text-gold hover:underline">
            See how it works
          </Link>
          {" · "}
          <Link to="/standards" className="text-gold hover:underline">
            Read the standards
          </Link>
        </p>
      </div>
    </section>
  );
};

// ─── FINAL CTA ─────────────────────────────────────────────────────
const FinalCTA = () => {
  const { user } = useAuth();
  const isAuthed = !!user;
  return (
    <section className="relative border-t border-border bg-card/40 px-4 sm:px-8 py-32 md:py-40">
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
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.02] tracking-tight mb-6 font-bold">
            Build something real. With the right person.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Five minutes to sign up. A day to get reviewed. Then it's just
            you and the people who can move the thing forward.
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
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
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
