"use client";
/**
 * Marketing homepage. One purpose: get a stranger to sign up.
 *
 * Structure (top to bottom):
 *   1. Hero - proportionally scaled: the section lays out at a fixed
 *      1536px logical width and is CSS-zoomed to the real viewport,
 *      so 80% browser zoom / different monitors all render the exact
 *      same composition, just bigger or smaller.
 *   2. RoleSplit - "which one am I": founder vs skills-to-offer.
 *   3. HowItWorksShowcase - 3 clickable step boxes (40%) + one
 *      animation at a time (60%).
 *   4. WhyVerified - the verification differentiator, with
 *      product-style comparison illustrations + scroll reveals.
 *   5. InteractiveDemoSection - laptop mockup running a guided,
 *      clickable tour of the real app flow.
 *
 * No sidebar on this page - the sidebar is an app-shell affordance
 * that belongs under /app/* where signed-in users live. The
 * marketing surface is wide and centered, with HomeAuthStrip
 * pinned top-right for sign-in / sign-up.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { ArrowRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/netstart/FadeUp";
import { Footer } from "@/components/netstart/Footer";
import { HomeAuthStrip } from "@/components/netstart/HomeAuthStrip";
import HowItWorksShowcase from "@/components/marketing/HowItWorksShowcase";
import WhyVerified from "@/components/marketing/WhyVerified";
import InteractiveDemoSection from "@/components/marketing/InteractiveDemo";
import MobileHome from "@/components/marketing/MobileHome";
import { BoostPopup } from "@/components/netstart/BoostPopup";
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

// Hero headline split per word so each can stagger-in on mount.
const HERO_WORDS: string[] = ["Cofounders", "found", "efficiently."];

const Home = () => {
  // Keeps the theme toggle's choice respected; `mode` drives the
  // Fazier badge's theme query param below so the badge ink matches
  // the current page palette.
  const { mode } = useTheme();

  // Signed-in users skip the marketing page entirely - Tinder-style.
  // If they hit polln8.com while authenticated, drop them straight
  // into the app (/app/match). Phone-UA visitors will get bounced to
  // the mobile bundle by the existing next.config redirect on
  // /app/match. Loading state holds back navigation until auth
  // hydrates so we don't ping-pong on a stale `null` user.
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (authLoading) return;
    if (user) navigate("/app/match", { replace: true });
  }, [user, authLoading, navigate]);

  // While auth is hydrating, render nothing instead of flashing the
  // marketing page (which would then yank away as the redirect
  // fires). Once we know the user is signed in, also render nothing
  // because the navigate above is about to take them away.
  if (authLoading || user) return null;

  return (
    <>
      {/* Mobile: dedicated condensed home page. Renders for narrow
          viewports (<768px) and stays out of the way on tablet/desktop
          via md:hidden inside MobileHome itself. */}
      <MobileHome />

      {/* Tablet + desktop: the full marketing site. Hidden on phones
          so the mobile layout owns the viewport without competing
          sections fighting for space. No sidebar - this is a logged-out
          marketing surface; the sidebar lives under /app/*. */}
      <div className="hidden md:block min-h-dvh bg-background text-foreground overflow-x-clip">
        <HomeAuthStrip />

        <main>
          <Hero />
          <RoleSplit />
          <HowItWorksShowcase />
          <WhyVerified />
          <InteractiveDemoSection />
        </main>

        {/* Fazier launch badge - sits between the marketing scroll
            and the Footer. Home-page only so it doesn't appear on
            every /app/* surface. Opens in a new tab. The badge
            image is served by Fazier so it auto-updates when our
            launch state changes (Featured / #1 of the day / etc.). */}
        <div className="flex justify-center py-8 border-t border-border">
          <a
            href="https://fazier.com/launches/polln8.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Polln8 on Fazier"
          >
            {/* Two explicit branches (one per Fazier theme) so there's
                no string-template ambiguity. key={mode} forces a fresh
                <img> element on every toggle, bypassing any cached
                entry the prior src may have left in browser memory. */}
            {mode === "dark" ? (
              <img
                key="fazier-dark"
                src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=dark"
                width={250}
                alt="Fazier badge"
              />
            ) : (
              <img
                key="fazier-light"
                src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=neutral"
                width={250}
                alt="Fazier badge"
              />
            )}
          </a>
        </div>

        <Footer />
      </div>

      {/* Floating bottom-right boost promo - desktop only. On mobile
          the corresponding promo lives on /app/match as the
          full-screen SpotlightModal. */}
      <div className="hidden md:block">
        <BoostPopup />
      </div>
    </>
  );
};

// ─── HERO ──────────────────────────────────────────────────────────
// The hero lays out against a fixed 1536px-wide logical canvas and
// is scaled to the real viewport with CSS zoom. Result: 80% browser
// zoom, 100% zoom, a 1280 laptop, and a 4K monitor all show the
// EXACT same composition - headline, image, and whitespace keep the
// same proportions, just rendered larger or smaller. (zoom affects
// layout, unlike transform: scale, so nothing overflows or doubles
// up; vh/vw units are deliberately avoided inside.)
const HERO_REF_W = 1536;

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

  // Proportional zoom factor: real viewport width / reference width.
  // clientWidth (not innerWidth) so the scrollbar doesn't skew it.
  // Recomputed on resize, which also fires when the user changes
  // browser zoom.
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const update = () =>
      setZoom(document.documentElement.clientWidth / HERO_REF_W);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Subtle scroll parallax on the moth illustration: it drifts up a
  // touch slower than the page, which makes the hero feel layered
  // without any added visuals. Skipped for reduced-motion and touch
  // devices, same policy as Magnetic.
  const mothRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = mothRef.current;
        if (!el) return;
        el.style.transform = `translateY(calc(-50% + ${
          window.scrollY * -0.06
        }px))`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Cursor-following CSS variable hook. The hero used to paint a
  // gold glow + parallax grid against these; the visuals were pulled
  // for being too noisy, but the hook stays so the section reads
  // mouse movement if we add a treatment back later.
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
      // Every dimension below is in 1536-reference logical pixels -
      // no responsive prefixes, no vh/vw. The zoom factor does ALL
      // of the scaling so the composition never reflows.
      className="relative px-8 pt-28 pb-36 overflow-hidden min-h-[640px] flex items-center"
      style={
        {
          zoom,
          "--mx": "50%",
          "--my": "-10%",
        } as React.CSSProperties
      }
    >
      {/* Moths + flowers illustration. Fixed 600px height in the
          logical canvas (≈ the 78vh it used to resolve to on the
          reference laptop), so it scales in lockstep with the
          headline instead of dancing to its own vh tune. */}
      <img
        ref={mothRef}
        src="/hero-moth.png"
        alt=""
        width={2380}
        height={1728}
        className="block absolute top-[52%] -translate-y-1/2 w-auto max-w-none object-contain select-none pointer-events-none"
        style={{
          height: 600,
          right: "-8%",
        }}
        draggable={false}
      />

      {/* Text column. max-w-2xl keeps the headline + paragraph from
          colliding with the image on the right. mx-auto + max-w-7xl
          keeps the column anchored to the same content gutter as the
          rest of the page. */}
      <div className="relative mx-auto w-full max-w-7xl">
        <div className="max-w-2xl">
          <h1 className="font-display text-8xl leading-[0.95] tracking-tight mb-6 font-bold">
            {HERO_WORDS.flatMap((w, i) => {
              const word = (
                <span
                  key={i}
                  className={cn(
                    "inline-block transition-all duration-700 ease-out",
                    mounted
                      ? "opacity-100 translate-y-0 "
                      : "opacity-0 translate-y-6 ",
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

          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed mb-10">
            Polln8 is a private network of vetted founders and technical
            partners. Every profile is reviewed by a human, every chat
            starts with mutual interest, and the deck is ranked against
            what you actually want to build.
          </p>

          <FadeUp delay={420} className="flex flex-wrap items-center gap-3">
            <Magnetic strength={10}>
              <Link to={isAuthed ? "/app/match" : "/signup"}>
                <Button variant="gold" size="xl" className="group">
                  {isAuthed ? "Open app" : "Sign up"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </Magnetic>
            <Magnetic strength={6}>
              <Link to={isAuthed ? "/app/match" : "/how"}>
                <Button variant="outlineGold" size="xl">
                  {isAuthed ? "Open Match" : "How it works"}
                </Button>
              </Link>
            </Magnetic>
            {/* Reviews CTA right in the hero so a first-time
                visitor can read social proof one click in - no
                scrolling required. Outline-only so the gold
                "Sign up" stays the single primary action. */}
            <Magnetic strength={4}>
              <Link to="/reviews">
                <Button variant="outline" size="xl" className="gap-2">
                  <Star className="h-4 w-4 text-gold" />
                  Reviews
                </Button>
              </Link>
            </Magnetic>
            {!isAuthed && (
              <Link
                to="/signin"
                className="text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                I already have an account
              </Link>
            )}
          </FadeUp>
        </div>
      </div>
    </section>
  );
};

// ─── ROLE SPLIT ────────────────────────────────────────────────────
// Immediately answers "which one am I." Two cards, each naming that
// side's specific pain and what they get here. Founders find
// partners; skilled people find startups that fit.
const RoleSplit = () => {
  const { user } = useAuth();
  const isAuthed = !!user;
  return (
    <section className="relative border-y border-border bg-card px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-4 text-center leading-[1.05] font-bold">
            Which one are you?
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto text-center mb-12">
            Founders find partners. Skilled people find startups that fit.
            Same network, two doors.
          </p>
        </FadeUp>

        <div className="grid gap-5 md:grid-cols-2">
          <FadeUp from="left" durationMs={800} className="h-full">
          <TiltCard intensity={4} className="group h-full">
            <article className="relative h-full rounded-sm border border-border bg-background p-8 transition-colors group-hover:border-gold">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold mb-3">
                I'm a founder
              </p>
              <h3 className="font-display text-3xl mb-4 leading-tight font-semibold">
                Stop posting into the void.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                You've pitched the forums, DM'd the strangers, survived
                the meetups. Here you swipe through verified people who
                actually want to join something, and they see exactly
                what you're building before they say yes.
              </p>
              <ul className="space-y-2.5 mb-7">
                <BulletItem>
                  Every person in your deck was reviewed by a human
                </BulletItem>
                <BulletItem>
                  They're here to join a startup, not sell you services
                </BulletItem>
                <BulletItem>
                  You approve who gets to talk to you
                </BulletItem>
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <Magnetic strength={6}>
                  <Link to={isAuthed ? "/app/profile/edit" : "/signup"}>
                    <Button variant="outlineGold" size="lg" className="group/btn">
                      {isAuthed ? "Edit your project" : "Find your partner"}
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
          </FadeUp>

          <FadeUp from="right" durationMs={800} delay={150} className="h-full">
          <TiltCard intensity={4} className="group h-full">
            <article className="relative h-full rounded-sm border border-border bg-background p-8 transition-colors group-hover:border-gold">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold mb-3">
                I have skills to offer
              </p>
              <h3 className="font-display text-3xl mb-4 leading-tight font-semibold">
                Find startups worth your time.
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Job boards bury you in reposted listings and recruiter
                noise. Here you browse real founders building real
                things, with stage, traction, and the ask up front. You
                pitch once, to someone who can actually say yes.
              </p>
              <ul className="space-y-2.5 mb-7">
                <BulletItem>
                  Real projects with real traction, not job-board noise
                </BulletItem>
                <BulletItem>
                  See the founder, the stage, and the equity ask up front
                </BulletItem>
                <BulletItem>
                  Mutual interest before anyone commits anything
                </BulletItem>
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <Magnetic strength={6}>
                  <Link to={isAuthed ? "/app/match" : "/signup"}>
                    <Button variant="outlineGold" size="lg" className="group/btn">
                      {isAuthed ? "Open Match" : "Browse startups"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </Magnetic>
                <Link
                  to="/how"
                  className="text-sm text-muted-foreground hover:text-gold transition-colors"
                >
                  How it works
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
  <li className="text-sm text-foreground leading-relaxed">{children}</li>
);

export default Home;
