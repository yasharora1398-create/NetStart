/**
 * Public marketing homepage. The product is hidden from a fresh
 * visitor in two ways elsewhere — most of the app is auth-gated,
 * /mynet is the post-signup landing — so this page has one job:
 * convince a stranger they should put their email in the form.
 *
 * Structure is hero → problem → approach → role split (founders
 * vs. builders) → social proof → how it works → FAQ → final CTA.
 * Each section sits inside a FadeUp so the page accumulates
 * momentum as the user scrolls. Tone is direct, not hype-y.
 */
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Hammer,
  MessageCircle,
  Shield,
  Sparkles,
  Target,
  Telescope,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Footer } from "@/components/netstart/Footer";
import { IconRail } from "@/components/netstart/IconRail";
import { FadeUp } from "@/components/netstart/FadeUp";
import { useTheme } from "@/hooks/useTheme";

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
        <Approach />
        <RoleSplit />
        <SocialProof />
        <HowItWorks />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
};

// ───────────────────────────────────────────────────────────────
// HERO
// ───────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="relative px-4 sm:px-8 pt-24 pb-32 md:pt-32 md:pb-40">
    {/* Soft ambient gradient — visible only against the dark
        surface; the gold accent reinforces brand without using
        any imagery. */}
    <div
      aria-hidden
      className="absolute inset-0 -z-10 opacity-60"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(var(--gold) / 0.18), transparent 60%)",
      }}
    />

    <div className="mx-auto max-w-5xl">
      <FadeUp>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/5 px-3 py-1.5">
          <Sparkles className="h-3 w-3 text-gold" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
            Cofounder matchmaking, with signal
          </span>
        </div>
      </FadeUp>

      <FadeUp delay={80}>
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl leading-[0.98] tracking-tight mb-6">
          Find the cofounder who{" "}
          <em className="not-italic text-gradient-gold">shows up</em>.<br />
          Not just the one who{" "}
          <span className="text-muted-foreground">responds first</span>.
        </h1>
      </FadeUp>

      <FadeUp delay={160}>
        <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
          Polln8 matches vetted founders with technical operators serious
          enough to build alongside them. Every profile is reviewed. Every
          chat is mutual. No swipe-spam, no ghosting — just the five people
          you'd actually want to talk to this week.
        </p>
      </FadeUp>

      <FadeUp delay={240}>
        <div className="flex flex-wrap gap-3">
          <Link to="/signup">
            <Button variant="gold" size="xl" className="group">
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link to="/how">
            <Button variant="outlineGold" size="xl">
              How it works
            </Button>
          </Link>
        </div>
      </FadeUp>

      <FadeUp delay={320}>
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
              <article className="h-full rounded-sm border border-border bg-background p-6">
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-sm border border-destructive/30 bg-destructive/5">
                  {it.icon}
                </div>
                <h3 className="font-display text-xl mb-2 leading-tight">
                  {it.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {it.body}
                </p>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
};

// ───────────────────────────────────────────────────────────────
// APPROACH — what Polln8 does differently
// ───────────────────────────────────────────────────────────────
const Approach = () => {
  const items = [
    {
      icon: <Shield className="h-5 w-5 text-gold" />,
      title: "Vetted on both sides",
      body: "Every profile — founder and builder — is reviewed by a human before it goes live. If we wouldn't introduce you to a friend, you don't get in.",
    },
    {
      icon: <Target className="h-5 w-5 text-gold" />,
      title: "Signal, not volume",
      body: "We don't show you 200 matches. We show you the five people whose skills, commitment, and stage actually line up with what you're building.",
    },
    {
      icon: <MessageCircle className="h-5 w-5 text-gold" />,
      title: "Mutual interest only",
      body: "Both sides have to say yes before chat opens. No cold DMs, no read receipts on a one-way pitch — every conversation starts on equal ground.",
    },
    {
      icon: <Hammer className="h-5 w-5 text-gold" />,
      title: "Project-first profiles",
      body: "Founders show what they're building, not a generic bio. Builders show what they've shipped. You decide based on real work, not vibes.",
    },
  ];

  return (
    <section className="px-4 sm:px-8 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <FadeUp>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
            How Polln8 is different
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl mb-12 max-w-3xl leading-[1.05]">
            Built for people who want to start something, not collect contacts.
          </h2>
        </FadeUp>

        <div className="grid gap-5 md:grid-cols-2">
          {items.map((it, i) => (
            <FadeUp key={it.title} delay={i * 80}>
              <article className="h-full rounded-sm border border-gold-soft bg-card p-7 hover:border-gold/60 transition-colors">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-sm border border-gold/40 bg-gold/10">
                  {it.icon}
                </div>
                <h3 className="font-display text-2xl mb-2 leading-tight">
                  {it.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {it.body}
                </p>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
};

// ───────────────────────────────────────────────────────────────
// ROLE SPLIT — for founders / for builders
// ───────────────────────────────────────────────────────────────
const RoleSplit = () => (
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
          <article className="group h-full rounded-sm border border-border bg-background/80 p-8 hover:border-gold/60 transition-colors">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-sm border border-gold/40 bg-gold/10 text-gold">
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
              skills and commitment actually match — not a thousand "ML
              enthusiasts" with side projects.
            </p>
            <ul className="space-y-2.5 mb-7">
              <BulletItem>One pitch covers every introduction</BulletItem>
              <BulletItem>Builders with shipped work, not just bios</BulletItem>
              <BulletItem>Block the noise — accept only the ones you want</BulletItem>
            </ul>
            <Link to="/signup">
              <Button variant="gold" size="lg" className="group">
                Post a project
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </article>
        </FadeUp>

        <FadeUp delay={120}>
          <article className="group h-full rounded-sm border border-border bg-background/80 p-8 hover:border-gold/60 transition-colors">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-sm border border-gold/40 bg-gold/10 text-gold">
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
              once when something fits — and only to people who can hear it.
            </p>
            <ul className="space-y-2.5 mb-7">
              <BulletItem>Browse projects, not LinkedIn job titles</BulletItem>
              <BulletItem>Mutual interest before any commitment</BulletItem>
              <BulletItem>Save the ones that intrigue you, ignore the rest</BulletItem>
            </ul>
            <Link to="/signup">
              <Button variant="gold" size="lg" className="group">
                Find a project
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </article>
        </FadeUp>
      </div>
    </div>
  </section>
);

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
  const stats = [
    { number: "100%", label: "Reviewed by a human" },
    { number: "<24h", label: "Average review time" },
    { number: "2", label: "Messages before they have to accept" },
    { number: "0", label: "Recruiters allowed" },
  ];
  return (
    <section className="px-4 sm:px-8 py-20 md:py-24">
      <div className="mx-auto max-w-5xl">
        <FadeUp>
          <div className="grid gap-6 md:grid-cols-4 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-5xl md:text-6xl text-gold mb-2 leading-none">
                  {s.number}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
};

// ───────────────────────────────────────────────────────────────
// HOW IT WORKS
// ───────────────────────────────────────────────────────────────
const HowItWorks = () => {
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
              <article className="h-full rounded-sm border border-border bg-background p-7">
                <p className="font-mono text-4xl text-gold mb-4 tracking-[0.18em]">
                  {s.n}
                </p>
                <h3 className="font-display text-xl mb-3 leading-tight">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.body}
                </p>
              </article>
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
      a: "No. If you have a clear idea, a problem you've been working on, or a project with one paying user — you're in. We're not for tire-kickers, but you don't need a polished deck either.",
    },
    {
      q: "What if I'm a builder, not a founder?",
      a: "That's most of our community. You don't need a startup or an idea — just the skills and the appetite to join one. You browse projects the same way founders browse builders.",
    },
    {
      q: "How long does review take?",
      a: "Usually under 24 hours. If we need more info we'll tell you what's missing instead of sitting on your application.",
    },
    {
      q: "Is it free?",
      a: "Yes, for now. We may charge later — likely for premium discovery or extra messaging — but the core network stays free for everyone who's been vetted in.",
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
                  <span className="font-mono text-xs text-gold transition-transform group-open:rotate-45">
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
      </div>
    </section>
  );
};

// ───────────────────────────────────────────────────────────────
// FINAL CTA
// ───────────────────────────────────────────────────────────────
const FinalCTA = () => (
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
          <Link to="/signup">
            <Button variant="gold" size="xl" className="group">
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link to="/signin">
            <Button variant="ghost" size="xl">
              I already have an account
            </Button>
          </Link>
        </div>
      </FadeUp>
    </div>
  </section>
);

export default Home;
