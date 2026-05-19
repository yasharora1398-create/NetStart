import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { useInView } from "@/hooks/useInView";

// ─── Types & data ────────────────────────────────────────────────
type MockupKind = "review" | "matches" | "request" | "placeholder";
export type Persona = "founder" | "builder";

const WHY: {
  title: string;
  body: string;
  details: string[];
  mockup: MockupKind;
}[] = [
  {
    title: "Every signup gets a real review.",
    body: "A human looks at your LinkedIn, your resume, and your public work before you ever see the deck.",
    details: [
      "Manual review of every signup, not auto-approval.",
      "LinkedIn and resume cross-checked against public work.",
      "Rejected applicants get a reviewer note and a resubmit path.",
    ],
    mockup: "review",
  },
  {
    title: "The deck is ranked against what you've built.",
    body: "Profiles and projects get embedded into vectors and ordered by real similarity to your work, not engagement metrics.",
    details: [
      "Embeddings of your profile and project intent drive ranking.",
      "Skills weighted by what you've actually shipped, not claimed.",
      "Re-ranks daily as profiles and projects update.",
    ],
    mockup: "matches",
  },
  {
    title: "Three actions per card. That's it.",
    body: "Connect, save, or pass. No likes, no maybes, no fourth bucket to delay the decision.",
    details: [
      "Three actions per card. No fourth option to defer.",
      "One pitch per request, no copy-paste spam.",
      "Accepted requests turn into mutual contacts immediately.",
    ],
    mockup: "request",
  },
];

// ─── Reveal wrapper ──────────────────────────────────────────────
// Fade-up + un-blur as the wrapped block enters the viewport. Uses
// the shared .reveal / .reveal-on classes from index.css so all
// reveals across the site share one motion language.
const Reveal = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 });
  return (
    <div
      ref={ref}
      className={`reveal${inView ? " reveal-on" : ""}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

// ─── Section export ──────────────────────────────────────────────
// Drop-in marketing section. Renders three reasons in a zig-zag
// layout: row 1 text-left/mockup-right, row 2 text-right/mockup-left,
// row 3 text-left/mockup-right. Mockup column hides on phones
// (`hidden lg:flex`); text-only on small screens.
//
// `persona` flips rows 2 and 3 to a founder POV: Matches deck shows
// builders looking to join startups, Request mockup targets an
// operator and the pitch reads as the founder writing to them.
// Defaults to "builder" (the original deck content).
const WhySection = ({ persona = "builder" }: { persona?: Persona }) => {
  return (
    <section className="mx-auto max-w-6xl px-5 md:px-8 py-20 md:py-28 space-y-20 md:space-y-28">
      {WHY.map((w, i) => (
        <Reveal key={w.title}>
          <WhyRow entry={w} reverse={i % 2 === 1} persona={persona} />
        </Reveal>
      ))}
    </section>
  );
};

export default WhySection;

// ─── WhyRow ──────────────────────────────────────────────────────
// Each WHY row: text block on one side, mockup on the other (zig-zag).
// Text sits inside a frosted-glass card. Mockup column is hidden on
// phones - `hidden lg:flex` - so phones show only text. Text block
// keeps its hover-to-reveal-details interaction.
const WhyRow = ({
  entry,
  reverse,
  persona,
}: {
  entry: (typeof WHY)[number];
  reverse: boolean;
  persona: Persona;
}) => {
  const textCol = (
    <div
      className={`group cursor-default rounded-2xl border border-border bg-card/60 backdrop-blur-md p-6 md:p-8 ${
        reverse ? "lg:order-2" : "lg:order-1"
      }`}
    >
      <h3 className="font-display text-2xl md:text-3xl mb-3 tracking-[-0.02em] text-foreground font-bold">
        {entry.title}
      </h3>
      <p className="text-base leading-relaxed text-muted-foreground max-w-md">
        {entry.body}
      </p>
      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out">
        <div className="overflow-hidden">
          <ul className="space-y-2 border-l border-primary/30 pl-4 mt-5 max-w-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
            {entry.details.map((d) => (
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
    </div>
  );

  const mockupCol = (
    <div
      className={`hidden lg:flex justify-center ${
        reverse ? "lg:order-1 lg:justify-start" : "lg:order-2 lg:justify-end"
      }`}
    >
      {entry.mockup === "review" && <ReviewCardMockup />}
      {entry.mockup === "matches" && <MatchesCardMockup persona={persona} />}
      {entry.mockup === "request" && <RequestCardMockup persona={persona} />}
      {entry.mockup === "placeholder" && <MockupPlaceholder />}
    </div>
  );

  return (
    <article
      className={`grid gap-10 lg:gap-16 items-center ${
        reverse
          ? "lg:grid-cols-[62fr_38fr]"
          : "lg:grid-cols-[38fr_62fr]"
      }`}
    >
      {textCol}
      {mockupCol}
    </article>
  );
};

// ─── Placeholder slot ────────────────────────────────────────────
// Slot for a video the user is going to drop in later. Visually
// quiet so it doesn't compete with the live mockup above; just a
// dashed-border 16:12 panel with a small "Video coming" label.
const MockupPlaceholder = () => (
  <div
    className="relative w-full max-w-[440px] rounded-2xl border border-dashed border-border bg-card/40 flex items-center justify-center"
    style={{ aspectRatio: "16 / 12" }}
    aria-hidden
  >
    <div className="text-center px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
        Demo · Video coming
      </p>
      <p className="text-sm text-muted-foreground/80">
        We'll drop a real product clip in here.
      </p>
    </div>
  </div>
);

// ─── Polln8 Review Card mockup ───────────────────────────────────
// Direct port of the Polln8 Review Card.html design from the
// Anthropic design handoff. 16:12 landscape phone frame with a
// two-column layout: avatar + title on the left, status thread on
// the right. Auto-loops through three states: rest -> reviewing
// -> approved, with a 1500ms breath at approved before resetting.
type ReviewState = "rest" | "reviewing" | "approved";

const ReviewCardMockup = () => {
  const [state, setState] = useState<ReviewState>("rest");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let alive = true;
    const cycle = () => {
      if (!alive) return;
      setState("rest");
      const a = window.setTimeout(() => alive && setState("reviewing"), 600);
      const b = window.setTimeout(() => alive && setState("approved"), 600 + 1400);
      const c = window.setTimeout(() => alive && cycle(), 600 + 2800 + 1500);
      timers.current.push(a, b, c);
    };
    cycle();
    return () => {
      alive = false;
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, []);

  const isApproved = state === "approved";
  const isReviewing = state === "reviewing";
  const title = isApproved
    ? "Approved - welcome to Polln8"
    : isReviewing
      ? "Application under review"
      : "Application submitted";
  const sub = isApproved
    ? "All checks passed"
    : isReviewing
      ? "We're cross-checking your work"
      : "Thanks, Jordan. We'll be in touch.";
  const bottom = isApproved
    ? "Member #1,284 · joined just now"
    : "Average review time: 24 hours";

  return (
    <div
      className={`rc-state-${state} relative w-full max-w-[640px]`}
      style={
        {
          aspectRatio: "16 / 12",
          // Local CSS vars matching the design's palette. Accent
          // pulls from the live theme token; rest is the warm
          // pollen-amber from the design spec used for the
          // "under review" pulse so green stays = approved.
          "--rc-accent": "hsl(var(--primary))",
          "--rc-rest": "hsl(45 50% 70%)",
        } as React.CSSProperties
      }
    >
      {/* Bezel */}
      <div
        className="relative w-full h-full rounded-[28px] p-2 bg-card"
        style={{
          boxShadow:
            "inset 0 0 0 1px hsl(var(--foreground)), 0 30px 60px -24px rgba(0,0,0,0.45), 0 12px 24px -12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Screen */}
        <div
          className="relative w-full h-full rounded-[22px] overflow-hidden flex flex-col"
          style={{
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            padding: "clamp(16px, 3.2%, 28px) clamp(20px, 4%, 36px) clamp(14px, 3%, 24px)",
          }}
        >
          {/* App header */}
          <div
            className="flex items-center gap-2.5 pb-3.5 mb-2"
            style={{ borderBottom: "1px solid hsl(var(--foreground))" }}
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              application · step 3 of 3
            </span>
          </div>

          {/* Two-column layout */}
          <div
            className="grid flex-1 items-stretch py-2"
            style={{ gridTemplateColumns: "1fr 1.15fr", gap: "clamp(20px, 4%, 36px)" }}
          >
            {/* Left: avatar + title + subtitle */}
            <div
              className="flex flex-col items-center justify-center text-center px-2 py-3"
              style={{ borderRight: "1px solid hsl(var(--foreground))", paddingRight: "clamp(20px, 4%, 36px)" }}
            >
              <div className="relative mb-4 h-[88px] flex justify-center">
                <div
                  className="relative w-[84px] h-[84px] rounded-full flex items-center justify-center text-[30px] font-medium tracking-tight"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 28%, #2c2a25, #14130f)",
                    color: "#F4F1EA",
                    transition: "transform 420ms cubic-bezier(0.22,0.61,0.36,1)",
                  }}
                >
                  <span className="relative z-[2]">JK</span>
                  {/* Dashed orbit ring */}
                  <span
                    className="rc-ring absolute rounded-full"
                    style={{
                      inset: -7,
                      border: `1.5px ${
                        isApproved ? "solid" : "dashed"
                      } ${
                        isApproved
                          ? "var(--rc-accent)"
                          : isReviewing
                            ? "var(--rc-rest)"
                            : "hsl(var(--foreground))"
                      }`,
                      opacity: isApproved ? 1 : isReviewing ? 0.75 : 0.45,
                      transition: "opacity 420ms ease, border-color 420ms ease",
                    }}
                  />
                  {/* Approved badge - pops in via scale + bounce */}
                  <span
                    className="absolute flex items-center justify-center rounded-full z-[3]"
                    style={{
                      right: -2,
                      bottom: -2,
                      width: 28,
                      height: 28,
                      background: "var(--rc-accent)",
                      color: "#fff",
                      border: "3px solid hsl(var(--background))",
                      transform: isApproved ? "scale(1)" : "scale(0)",
                      opacity: isApproved ? 1 : 0,
                      transition:
                        "transform 380ms cubic-bezier(0.34,1.56,0.64,1), opacity 220ms ease",
                    }}
                  >
                    <Check className="h-3 w-3" strokeWidth={2.6} />
                  </span>
                </div>
                <ConfettiField active={isApproved} />
              </div>
              <div
                className="font-display text-[20px] md:text-[22px] font-medium tracking-tight leading-snug min-h-[28px]"
                style={{ transition: "color 220ms ease" }}
              >
                {title}
              </div>
              <div className="font-mono text-[12.5px] tracking-[0.04em] text-muted-foreground mt-2 min-h-[16px]">
                {sub}
              </div>
            </div>

            {/* Right: thread */}
            <div className="flex flex-col justify-center">
              <div className="py-1">
                <ThreadRow
                  kind="done"
                  title="Submitted"
                  meta="Today · 9:38 AM"
                />
                <ThreadRow
                  kind={isApproved ? "done" : "active"}
                  title="Under review"
                  meta={
                    isApproved
                      ? "Cleared in 21h"
                      : isReviewing
                        ? "Checking LinkedIn · GitHub · shipped work"
                        : "Pending - typical wait 24h"
                  }
                  pulseTone={isReviewing ? "accent" : "rest"}
                />
                <ThreadRow
                  kind={isApproved ? "done" : "pending"}
                  title="Approved"
                  meta={
                    isApproved
                      ? "Just now · welcome aboard"
                      : "Notification on file"
                  }
                  isLast
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="mt-3.5 pt-3.5 flex items-center gap-2.5 font-mono text-[11.5px] tracking-[0.04em] text-muted-foreground"
            style={{ borderTop: "1px dashed hsl(var(--foreground))" }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: isApproved
                  ? "var(--rc-accent)"
                  : "hsl(var(--muted-foreground))",
                transition: "background 420ms ease",
              }}
            />
            <span>{bottom}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThreadRow = ({
  kind,
  title,
  meta,
  pulseTone = "accent",
  isLast = false,
}: {
  kind: "done" | "active" | "pending";
  title: string;
  meta: string;
  pulseTone?: "accent" | "rest";
  isLast?: boolean;
}) => {
  const dotBg =
    kind === "done"
      ? "var(--rc-accent)"
      : kind === "active"
        ? pulseTone === "accent"
          ? "var(--rc-accent)"
          : "var(--rc-rest)"
        : "transparent";
  const dotBorder =
    kind === "pending"
      ? "hsl(var(--foreground))"
      : kind === "active"
        ? pulseTone === "accent"
          ? "var(--rc-accent)"
          : "var(--rc-rest)"
        : "var(--rc-accent)";
  return (
    <div
      className="grid relative pb-4"
      style={{ gridTemplateColumns: "28px 1fr", gap: 14 }}
    >
      <div className="relative flex flex-col items-center">
        <div
          className="relative z-[1] flex items-center justify-center rounded-full mt-0.5"
          style={{
            width: 16,
            height: 16,
            background: dotBg,
            border: `1.5px solid ${dotBorder}`,
            transition: "background 420ms ease, border-color 420ms ease",
            color: "#fff",
          }}
        >
          {kind === "done" && <Check className="h-2.5 w-2.5" strokeWidth={2.4} />}
          {kind === "active" && (
            <span
              className="rc-pulse absolute rounded-full"
              style={{
                inset: -5,
                border: `1.5px solid ${
                  pulseTone === "accent" ? "var(--rc-accent)" : "var(--rc-rest)"
                }`,
                opacity: 0.85,
              }}
            />
          )}
        </div>
        {!isLast && (
          <div
            className="flex-1 mt-0.5 -mb-4"
            style={{
              width: 1.5,
              background:
                kind === "done"
                  ? "var(--rc-accent)"
                  : "hsl(var(--foreground))",
              transition: "background 420ms ease",
            }}
          />
        )}
      </div>
      <div>
        <div
          className="text-[14.5px] font-medium tracking-tight leading-tight"
          style={{
            color:
              kind === "pending"
                ? "hsl(var(--muted-foreground))"
                : "hsl(var(--foreground))",
          }}
        >
          {title}
        </div>
        <div className="font-mono text-[11.5px] tracking-[0.02em] text-muted-foreground mt-0.5 leading-snug">
          {meta}
        </div>
      </div>
    </div>
  );
};

const ConfettiField = ({ active }: { active: boolean }) => {
  // 9 hairline particles drifting upward, fading. Restrained per the
  // design's "vetted not viral" tone - no rotation, no gold shower.
  const particles = useMemo(() => {
    const seeded = (i: number) => {
      const s = Math.sin(i * 928.3) * 10000;
      return s - Math.floor(s);
    };
    return Array.from({ length: 9 }, (_, i) => ({
      x: 8 + seeded(i) * 84,
      d: 28 + seeded(i + 11) * 38,
      delay: seeded(i + 23) * 220,
      size: 2 + seeded(i + 31) * 2,
      hueShift: i % 3,
    }));
  }, []);
  return (
    <div
      className={`rc-confetti absolute inset-0 pointer-events-none overflow-visible ${
        active ? "is-on" : ""
      }`}
      aria-hidden
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="rc-confetti__p absolute bottom-2 rounded-[1px]"
          style={
            {
              left: `${p.x}%`,
              width: p.size,
              height: p.size,
              opacity: 0,
              transform: "translateY(0)",
              "--drift": `-${p.d}px`,
              "--delay": `${p.delay}ms`,
              background:
                p.hueShift === 0
                  ? "var(--rc-accent)"
                  : p.hueShift === 1
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--foreground))",
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

// ─── Polln8 Matches Card mockup ─────────────────────────────────
// Direct port of the Polln8 Matches Card.html design from the
// Anthropic design handoff (latest revision: square photo
// placeholder w/ silhouette, profile detail tab slides up from
// the bottom on right-swipe, with a swipe-down handle to dismiss).
//
// 5-phase auto-loop:
//   0 rest             - Maya on top, Ravi behind
//   1 maya-swiping     - Maya swipes right (Save)
//   2 detail-tab-open  - Maya's profile sheet slides up
//   3 detail+next      - sheet still open, Ravi grows behind
//   4 ravi-swiping     - sheet retracts, Ravi swipes left (Pass)
type Frontness =
  | "top"
  | "behind1"
  | "swiping-right"
  | "swiping-left"
  | "gone-right"
  | "gone-left";

// Inline-style lookup so React directly drives transform/opacity per
// phase change - bypasses any cascade conflicts that were keeping
// the cards visually static.
const FRONTNESS_STYLE: Record<
  Frontness,
  { transform: string; opacity: number; zIndex: number }
> = {
  top: { transform: "translateY(0) scale(1)", opacity: 1, zIndex: 5 },
  behind1: { transform: "translateY(14px) scale(0.95)", opacity: 1, zIndex: 4 },
  "swiping-right": {
    transform: "translateX(330px) translateY(-10px) rotate(8deg)",
    opacity: 1,
    zIndex: 5,
  },
  "swiping-left": {
    transform: "translateX(-330px) translateY(-10px) rotate(-8deg)",
    opacity: 1,
    zIndex: 5,
  },
  "gone-right": {
    transform: "translateX(330px) rotate(8deg)",
    opacity: 0,
    zIndex: 5,
  },
  "gone-left": {
    transform: "translateX(-330px) rotate(-8deg)",
    opacity: 0,
    zIndex: 5,
  },
};

type ProfileEntry = {
  id: string;
  name: string;
  pills: string[];
  skills: string[];
  headline: string;
};

const MAYA: ProfileEntry = {
  id: "maya",
  name: "Maya C.",
  pills: ["Full-time", "Remote", "Founder"],
  skills: ["Frontend", "Design", "Product"],
  headline:
    "Two-time founder, last exit Series A. Hiring a technical cofounder for a creator-economy tool - pre-seed, prototype live.",
};
const RAVI: ProfileEntry = {
  id: "ravi",
  name: "Ravi T.",
  pills: ["20 hrs/week", "NYC", "Founder"],
  skills: ["Backend", "AI/ML", "Sales"],
  headline:
    "Solo founder. AI scheduling for outpatient clinics, $8K MRR after 4 months. Looking for a design partner to own the product surface.",
};

// Founder-side cards: people looking to JOIN startups (builders).
const LIAM: ProfileEntry = {
  id: "liam",
  name: "Liam P.",
  pills: ["Full-time", "NYC", "Builder"],
  skills: ["Backend", "Distributed Sys", "Rust"],
  headline:
    "Senior backend engineer, ex-Stripe payments. Looking to join a venture with real customers and meaningful equity.",
};
const ZARA: ProfileEntry = {
  id: "zara",
  name: "Zara R.",
  pills: ["30 hrs/week", "Remote", "Builder"],
  skills: ["Frontend", "Design", "Product"],
  headline:
    "Product designer with two YC launches. Looking to own the product surface for a small team that's already shipping.",
};

// Info-sheet content shown when the secondary card is right-swiped.
// Builder POV: Maya (founder) shows her shipped projects.
// Founder POV: Zara (builder) shows her recent shipped work.
type DeckInfoSheet = {
  name: string;
  role: string;
  sectionLabel: string;
  rows: { name: string; tag: string; desc: string }[];
  links: { icon: string; label: string; url: string }[];
};
const MAYA_INFO: DeckInfoSheet = {
  name: "Maya C.",
  role: "Founder · Remote · Full-time",
  sectionLabel: "Currently building",
  rows: [
    {
      name: "Pollenboard",
      tag: "Shipped",
      desc: "Design system for indie tooling - v2 live, used by 40+ small teams.",
    },
    {
      name: "Toolspace",
      tag: "Beta",
      desc: "Async pairing app for solo founders. MVP shipped in March.",
    },
  ],
  links: [
    { icon: "in", label: "LinkedIn", url: "/in/mayac" },
    { icon: "PDF", label: "Résumé", url: "maya-c.pdf" },
  ],
};
const ZARA_INFO: DeckInfoSheet = {
  name: "Zara R.",
  role: "Builder · Remote · 30 hrs/week",
  sectionLabel: "Recently shipped",
  rows: [
    {
      name: "Linear Insights",
      tag: "Shipped",
      desc: "Lead designer on the analytics surface - used daily by 12K+ teams.",
    },
    {
      name: "Glow",
      tag: "Beta",
      desc: "Solo project. Onboarding flow tooling for early-stage SaaS.",
    },
  ],
  links: [
    { icon: "in", label: "LinkedIn", url: "/in/zarar" },
    { icon: "PDF", label: "Résumé", url: "zara-r.pdf" },
  ],
};

const MatchesCardMockup = ({ persona }: { persona: Persona }) => {
  const isFounder = persona === "founder";
  // Builder POV (original): cards are founders posting projects.
  // Founder POV: cards are builders looking to join startups.
  const primary = isFounder ? LIAM : RAVI;
  const secondary = isFounder ? ZARA : MAYA;
  const info = isFounder ? ZARA_INFO : MAYA_INFO;
  const ctaLabel = isFounder ? "Request chat" : "Apply";

  const [phase, setPhase] = useState(0);
  const timers = useRef<number[]>([]);
  // 5 phases - two-person flow per the user's spec:
  //   0 primary rest          (first person shown)
  //   1 primary swipes left   (skip - translates + fades)
  //   2 secondary rest        (second person, now on top)
  //   3 secondary swipes right (save - slides off)
  //   4 info sheet up         (secondary's projects, LinkedIn, résumé)
  const phaseDur = useMemo(() => [1400, 900, 1400, 800, 2000], []);

  useEffect(() => {
    let alive = true;
    let p = 0;
    const tick = () => {
      if (!alive) return;
      setPhase(p);
      const t = window.setTimeout(() => {
        p = (p + 1) % 5;
        tick();
      }, phaseDur[p]);
      timers.current.push(t);
    };
    tick();
    return () => {
      alive = false;
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, [phaseDur]);

  const primaryFront: Frontness = (
    ["top", "swiping-left", "gone-left", "gone-left", "gone-left"] as const
  )[phase];
  const secondaryFront: Frontness = (
    ["behind1", "behind1", "top", "swiping-right", "gone-right"] as const
  )[phase];

  const hint =
    phase === 1
      ? "Passed - won't show again"
      : phase === 3
        ? "Saving - opening profile"
        : phase === 4
          ? `${info.name} · profile open`
          : "Swipe right to save · left to pass";

  return (
    <div
      className={`mc-phase-${phase} relative w-full max-w-[640px]`}
      style={{ aspectRatio: "16 / 12" }}
    >
      {/* Bezel */}
      <div
        className="relative w-full h-full rounded-[28px] p-2 bg-card"
        style={{
          boxShadow:
            "inset 0 0 0 1px hsl(var(--foreground)), 0 30px 60px -24px rgba(0,0,0,0.45), 0 12px 24px -12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Screen */}
        <div
          className="relative w-full h-full rounded-[22px] overflow-hidden flex flex-col"
          style={{
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
          }}
        >
          {/* App bar */}
          <div
            className="grid items-center gap-4 text-[13px] font-medium tracking-tight"
            style={{
              gridTemplateColumns: "1fr auto 1fr",
              padding: "16px 22px 14px",
              borderBottom: "1px solid hsl(var(--border))",
            }}
          >
            <span className="inline-flex items-center gap-2 font-semibold">
              <span
                className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-[16px] leading-none"
                style={{
                  background: "hsl(var(--secondary))",
                  color: "hsl(var(--muted-foreground))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                ‹
              </span>
              Matches
            </span>
            <span className="inline-flex gap-1 justify-self-center">
              <span
                className="text-[12px] px-3 py-1 rounded-full"
                style={{
                  background: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                For you
              </span>
              <span className="text-[12px] px-3 py-1 rounded-full opacity-55">
                Saved
              </span>
            </span>
          </div>

          {/* Deck area - two cards plus the profile-detail sheet that
              slides up when Maya is right-swiped. No edge glows; left
              swipes just fade out and right swipes hand off to the
              sheet. */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden p-6">
            <ProfileCardMockup
              profile={primary}
              frontness={primaryFront}
              ctaLabel={ctaLabel}
            />
            <ProfileCardMockup
              profile={secondary}
              frontness={secondaryFront}
              ctaLabel={ctaLabel}
            />

            {/* Info sheet - slides up from the bottom on phase 2 and
                stays through the rest of Maya's stay. Hidden during
                Ravi's frames (phases 3, 4). */}
            <div
              className="mc-profile-tab absolute left-0 right-0 bottom-0 flex flex-col gap-3.5 z-[5]"
              style={{
                top: 28,
                padding: "10px 22px 18px",
                borderRadius: "18px 18px 16px 16px",
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderBottom: "none",
                boxShadow: "0 -20px 40px -20px rgba(0,0,0,0.35)",
              }}
              aria-hidden={phase !== 4}
            >
              <div
                className="self-center rounded-full"
                style={{
                  width: 44,
                  height: 5,
                  background: "hsl(var(--foreground))",
                  margin: "4px 0 6px",
                }}
              />
              <div
                className="flex items-center justify-between font-mono uppercase"
                style={{
                  fontSize: "9.5px",
                  letterSpacing: "0.1em",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                <span>Profile</span>
                <span>Saved</span>
              </div>

              <div>
                <div
                  className="font-semibold tracking-tight"
                  style={{ fontSize: 17 }}
                >
                  {info.name}
                </div>
                <div className="opacity-70 mt-0.5" style={{ fontSize: 11 }}>
                  {info.role}
                </div>
              </div>

              <div>
                <div
                  className="font-mono uppercase mb-1.5 opacity-55"
                  style={{ fontSize: 9, letterSpacing: "0.12em" }}
                >
                  {info.sectionLabel}
                </div>
                <div className="flex flex-col gap-2">
                  {info.rows.map((r) => (
                    <ProjectRow
                      key={r.name}
                      name={r.name}
                      tag={r.tag}
                      desc={r.desc}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div
                  className="font-mono uppercase mb-1.5 opacity-55"
                  style={{ fontSize: 9, letterSpacing: "0.12em" }}
                >
                  Links
                </div>
                <div className="flex flex-col gap-1.5">
                  {info.links.map((l) => (
                    <LinkRow
                      key={l.label}
                      icon={l.icon}
                      label={l.label}
                      url={l.url}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div
            className="grid items-center gap-3"
            style={{
              gridTemplateColumns: "auto 1fr auto",
              padding: "12px 22px 16px",
              borderTop: "1px solid hsl(var(--border))",
            }}
          >
            <button
              type="button"
              tabIndex={-1}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[13px] font-medium"
              style={{
                color: "hsl(var(--muted-foreground))",
                border: "1px solid hsl(var(--border))",
                background: "transparent",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3 3 L9 9 M9 3 L3 9"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
              Pass
            </button>
            <span
              className="inline-flex items-center justify-center gap-2 font-mono uppercase"
              style={{
                fontSize: "10.5px",
                letterSpacing: "0.06em",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "hsl(var(--primary))" }}
              />
              {hint}
            </span>
            <button
              type="button"
              tabIndex={-1}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[13px] font-medium"
              style={{
                color: "#ffffff",
                border: "1px solid hsl(var(--primary))",
                background: "hsl(var(--primary))",
              }}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileCardMockup = ({
  profile,
  frontness,
  ctaLabel,
}: {
  profile: ProfileEntry;
  frontness: Frontness;
  ctaLabel: string;
}) => {
  const pos = FRONTNESS_STYLE[frontness];
  return (
  <div
    className="mc-pcard absolute flex flex-col gap-1.5"
    style={{
      width: 296,
      minHeight: 240,
      borderRadius: 14,
      padding: "12px 14px 12px",
      background: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      color: "hsl(var(--foreground))",
      boxShadow: "0 18px 36px -18px rgba(0,0,0,0.4)",
      transform: pos.transform,
      opacity: pos.opacity,
      zIndex: pos.zIndex,
    }}
    data-id={profile.id}
    data-front={frontness}
  >
    {/* Edge labels - appear during swipe */}
    <div
      className="mc-edge-label mc-edge-label--save absolute top-4 right-4 inline-flex items-center gap-1 font-bold uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.08em",
        padding: "4px 8px",
        borderRadius: 4,
        border: "1.5px solid hsl(var(--primary))",
        color: "hsl(var(--primary))",
        transform: "rotate(8deg)",
      }}
    >
      <Check className="h-3 w-3" strokeWidth={2.5} />
      Save
    </div>
    <div
      className="mc-edge-label mc-edge-label--pass absolute top-4 left-4 inline-flex items-center gap-1 font-bold uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.08em",
        padding: "4px 8px",
        borderRadius: 4,
        border: "1.5px solid hsl(var(--muted-foreground))",
        color: "hsl(var(--muted-foreground))",
        transform: "rotate(-8deg)",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M3 3 L9 9 M9 3 L3 9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      Pass
    </div>

    <div
      className="font-semibold tracking-tight"
      style={{ fontSize: 18, marginTop: 2 }}
    >
      {profile.name}
    </div>

    {/* Photo banner placeholder w/ hatch + silhouette */}
    <div
      className="relative w-full overflow-hidden rounded-lg flex items-center justify-center"
      style={{
        aspectRatio: "16 / 7",
        margin: "2px 0",
        background: "hsl(var(--primary))",
        color: "#ffffff",
      }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent 0 8px, currentColor 8px 9px)",
          opacity: 0.18,
        }}
      />
      <svg
        className="relative z-[1]"
        viewBox="0 0 64 64"
        fill="none"
        style={{ width: "46%", opacity: 0.55 }}
      >
        <circle cx="32" cy="22" r="11" fill="currentColor" />
        <path
          d="M8 60 C 10 44, 22 38, 32 38 C 42 38, 54 44, 56 60 Z"
          fill="currentColor"
        />
      </svg>
    </div>

    <div className="flex flex-wrap gap-1.5">
      {profile.pills.map((p) => (
        <span
          key={p}
          className="inline-flex items-center font-medium"
          style={{
            fontSize: 12,
            padding: "5px 10px",
            borderRadius: 999,
            background: "hsl(var(--primary))",
            color: "#ffffff",
            border: "1px solid hsl(var(--primary))",
          }}
        >
          {p}
        </span>
      ))}
    </div>

    <div className="flex flex-wrap gap-1.5">
      {profile.skills.map((s) => (
        <span
          key={s}
          className="inline-flex items-center font-medium"
          style={{
            fontSize: 12,
            padding: "5px 10px",
            borderRadius: 999,
            background: "hsl(var(--card))",
            color: "hsl(var(--muted-foreground))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          {s}
        </span>
      ))}
    </div>

    <div
      className="leading-snug line-clamp-2"
      style={{
        fontSize: 13.5,
        marginTop: 4,
        color: "hsl(var(--muted-foreground))",
      }}
    >
      {profile.headline}
    </div>

    <button
      type="button"
      tabIndex={-1}
      className="mt-auto inline-flex items-center justify-center gap-2 font-semibold cursor-pointer"
      style={{
        height: 38,
        border: "none",
        borderRadius: 10,
        fontSize: 14,
        background: "hsl(var(--primary))",
        color: "hsl(var(--primary-foreground))",
      }}
    >
      {ctaLabel}
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
        <path
          d="M3 7 L11 7 M7 3 L11 7 L7 11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  </div>
  );
};

const ProjectRow = ({
  name,
  tag,
  desc,
}: {
  name: string;
  tag: string;
  desc: string;
}) => (
  <div
    className="grid items-baseline gap-2 px-2.5 py-2 rounded-lg"
    style={{
      gridTemplateColumns: "1fr auto",
      background: "hsl(var(--foreground))",
    }}
  >
    <span
      className="font-semibold tracking-tight"
      style={{ fontSize: 12 }}
    >
      {name}
    </span>
    <span
      className="font-mono uppercase"
      style={{
        fontSize: 8.5,
        letterSpacing: "0.08em",
        padding: "3px 6px",
        borderRadius: 4,
        background: "hsl(var(--primary))",
        color: "#ffffff",
      }}
    >
      {tag}
    </span>
    <span
      className="opacity-70 leading-snug col-span-full"
      style={{ fontSize: 10.5, marginTop: 2 }}
    >
      {desc}
    </span>
  </div>
);

const LinkRow = ({
  icon,
  label,
  url,
}: {
  icon: string;
  label: string;
  url: string;
}) => (
  <div
    className="flex items-center justify-between px-2.5 py-2 rounded-lg"
    style={{
      background: "hsl(var(--foreground))",
      fontSize: 11.5,
      fontWeight: 500,
    }}
  >
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex items-center justify-center font-mono font-bold"
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          fontSize: 9,
          letterSpacing: "0.04em",
          background: "hsl(var(--primary))",
          color: "#ffffff",
        }}
      >
        {icon}
      </span>
      <span>{label}</span>
    </span>
    <span
      className="font-mono opacity-60"
      style={{ fontSize: 10 }}
    >
      {url}
    </span>
  </div>
);

// ─── Polln8 Request Card mockup ─────────────────────────────────
// Direct port of the Polln8 Request Card.html design from the
// Anthropic design handoff. 4-phase auto-loop:
//   0 rest      - profile card with Apply CTA pulsing
//   1 composer  - sheet slides up, pitch types in character-by-char
//   2 sent      - sheet drops, status pill "Request sent" + glow
//   3 accepted  - pill flips green "Accepted", solid ring on
//                 avatar, Open chat reveals
// Builder POV (original): pitch operator → founder asking to join.
const REQUEST_PROFILE_BUILDER = {
  monogram: "JK",
  name: "Jamie K.",
  firstName: "Jamie",
  pills: ["Full-time", "SF", "Founder"],
  skills: ["Product", "Sales", "Fundraising"],
  headline:
    "Building a B2B platform for restaurant operators. $40K MRR, looking for a technical cofounder to lead engineering.",
};
const REQUEST_PITCH_BUILDER =
  "I've shipped two B2B products in restaurant tech. Saw your MRR growth - I think I can help you cross $100K and lead the engineering build-out. Free to talk this week.";

// Founder POV: target is an operator. The "pitch" reads as the
// founder writing to that operator - the first chat message rather
// than a self-pitch.
const REQUEST_PROFILE_FOUNDER = {
  monogram: "TP",
  name: "Taylor P.",
  firstName: "Taylor",
  pills: ["Full-time", "Remote", "Builder"],
  skills: ["Backend", "Devtools", "Postgres"],
  headline:
    "Senior engineer, ex-Stripe payments and Linear. Looking for a venture with real users and meaningful equity.",
};
const REQUEST_PITCH_FOUNDER =
  "I'm building a B2B clinic-ops platform - $8K MRR, real users, technical surface that needs an owner. Your devtools work looks like exactly what I need next to me. Free to chat this week?";

const RequestCardMockup = ({ persona }: { persona: Persona }) => {
  const isFounder = persona === "founder";
  const profile = isFounder ? REQUEST_PROFILE_FOUNDER : REQUEST_PROFILE_BUILDER;
  const pitch = isFounder ? REQUEST_PITCH_FOUNDER : REQUEST_PITCH_BUILDER;
  const ctaLabel = isFounder ? "Request chat" : "Apply";
  const placeholder = isFounder
    ? `Tell ${profile.firstName} why they'd be a great fit for what you're building…`
    : `Tell ${profile.firstName} why you'd be the right person to build this with…`;
  const composerLead = isFounder
    ? "First message. First impression."
    : "One pitch. One shot.";

  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState("");
  const timers = useRef<number[]>([]);

  // Phase durations proportional to total ~6.4s, then loops.
  // 0 rest 18%, 1 typing 36%, 2 sent 22%, 3 accepted 24%.
  useEffect(() => {
    const D = 6400;
    const lens = [D * 0.18, D * 0.36, D * 0.22, D * 0.24];
    let alive = true;
    let p = 0;

    const run = () => {
      if (!alive) return;
      setPhase(p);

      // Typing animation during phase 1.
      if (p === 1) {
        setTyped("");
        const step = Math.max(18, lens[1] / Math.max(1, pitch.length + 6));
        let i = 0;
        const typer = () => {
          if (!alive) return;
          i += 1;
          setTyped(pitch.slice(0, i));
          if (i < pitch.length) {
            const t = window.setTimeout(typer, step);
            timers.current.push(t);
          }
        };
        const t0 = window.setTimeout(typer, 280);
        timers.current.push(t0);
      }

      const t = window.setTimeout(() => {
        p = (p + 1) % 4;
        run();
      }, lens[p]);
      timers.current.push(t);
    };
    run();
    return () => {
      alive = false;
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, [pitch]);

  const sentTap = phase === 1 && typed.length === pitch.length;

  return (
    <div
      className={`rq-phase-${phase} relative w-full max-w-[640px]`}
      style={{ aspectRatio: "16 / 12" }}
    >
      {/* Bezel */}
      <div
        className="relative w-full h-full rounded-[28px] p-2 bg-card"
        style={{
          boxShadow:
            "inset 0 0 0 1px hsl(var(--foreground)), 0 30px 60px -24px rgba(0,0,0,0.45), 0 12px 24px -12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Screen */}
        <div
          className="relative w-full h-full rounded-[22px] overflow-hidden flex flex-col"
          style={{
            background: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
          }}
        >
          {/* App bar */}
          <div
            className="grid items-center text-[12px] font-medium"
            style={{
              gridTemplateColumns: "1fr auto 1fr",
              padding: "14px 16px 12px",
              borderBottom: "1px solid hsl(var(--border))",
            }}
          >
            <span className="font-bold tracking-tight" style={{ fontSize: 13 }}>
              Polln8
            </span>
            <span className="inline-flex gap-1 justify-self-center">
              <span
                className="px-2.5 py-1 rounded-full"
                style={{
                  fontSize: 11,
                  background: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                Matches
              </span>
              <span
                className="px-2.5 py-1 rounded-full opacity-55"
                style={{ fontSize: 11 }}
              >
                Saved
              </span>
            </span>
          </div>

          {/* Card area */}
          <div className="relative flex-1 p-4 overflow-hidden">
            <div
              className={`relative flex flex-col gap-2 rounded-xl p-3.5 ${
                phase === 2 ? "rq-glow" : ""
              }`}
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                boxShadow:
                  phase === 2
                    ? "0 0 0 1px hsl(var(--primary)), 0 0 60px hsl(var(--primary))"
                    : "none",
                transition: "box-shadow 500ms ease",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="relative flex items-center justify-center font-semibold"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "hsl(var(--primary))",
                    color: "#ffffff",
                    fontSize: 12,
                    boxShadow:
                      phase === 3
                        ? "0 0 0 2px hsl(var(--primary))"
                        : phase === 2
                          ? "0 0 0 2px hsl(var(--primary))"
                          : "none",
                    transition: "box-shadow 280ms ease",
                  }}
                >
                  {profile.monogram}
                </div>
                <div
                  className="font-semibold tracking-tight"
                  style={{ fontSize: 16 }}
                >
                  {profile.name}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {profile.pills.map((p) => (
                  <span
                    key={p}
                    className="font-medium leading-[1.5]"
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: "hsl(var(--primary))",
                      color: "#ffffff",
                      border: "1px solid hsl(var(--primary))",
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 -mt-1">
                {profile.skills.map((s) => (
                  <span
                    key={s}
                    className="font-medium leading-[1.5]"
                    style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 999,
                      background: "hsl(var(--card))",
                      color: "hsl(var(--muted-foreground))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>

              <div
                className="leading-snug"
                style={{
                  fontSize: 12,
                  color: "hsl(var(--muted-foreground))",
                  marginTop: 2,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {profile.headline}
              </div>

              {/* CTA / Status - same physical slot, content swaps per phase */}
              <div
                className="flex items-stretch mt-1"
                style={{ minHeight: 38 }}
              >
                {phase === 0 && (
                  <button
                    type="button"
                    tabIndex={-1}
                    className="rq-pulse-cta w-full rounded-lg font-semibold flex items-center justify-center gap-1.5"
                    style={{
                      padding: "10px 14px",
                      fontSize: 13,
                      background: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    }}
                  >
                    {ctaLabel}
                  </button>
                )}
                {phase === 1 && (
                  <button
                    type="button"
                    tabIndex={-1}
                    className="w-full rounded-lg font-semibold flex items-center justify-center gap-1.5"
                    style={{
                      padding: "10px 14px",
                      fontSize: 13,
                      background: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                      transform: "scale(0.97)",
                      transition: "transform 120ms ease",
                    }}
                  >
                    {ctaLabel}
                  </button>
                )}
                {phase === 2 && (
                  <div
                    className="w-full rounded-lg font-semibold flex items-center justify-center gap-1.5"
                    style={{
                      padding: "10px 14px",
                      fontSize: 13,
                      background: "hsl(var(--primary))",
                      color: "#ffffff",
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <circle
                        cx="6"
                        cy="6"
                        r="4.5"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M6 3.5 L6 6 L7.8 7"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                    Request sent
                  </div>
                )}
                {phase === 3 && (
                  <div
                    className="w-full rounded-lg font-semibold flex items-center justify-center gap-1.5"
                    style={{
                      padding: "10px 14px",
                      fontSize: 13,
                      background: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    }}
                  >
                    <Check className="h-3 w-3" strokeWidth={2.4} />
                    Accepted
                  </div>
                )}
              </div>

              {phase === 2 && (
                <div
                  className="text-center"
                  style={{
                    fontSize: 11,
                    color: "hsl(var(--muted-foreground))",
                    marginTop: 2,
                  }}
                >
                  You&apos;ll get notified when {profile.firstName} responds.
                </div>
              )}
              {phase === 3 && (
                <div className="flex flex-col gap-2 mt-1">
                  <div
                    className="text-center font-medium"
                    style={{ fontSize: 12 }}
                  >
                    Mutual contact. Message {profile.firstName} now.
                  </div>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="w-full rounded-lg font-semibold flex items-center justify-center gap-1.5"
                    style={{
                      padding: "10px 14px",
                      fontSize: 13,
                      background: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    }}
                  >
                    Open chat
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6 L10 6 M6 2 L10 6 L6 10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Composer sheet - slides up during phase 1 with typing
                pitch. Drops away in phases 2/3 (transform handled by
                the .rq-phase-1 selector in index.css). */}
            <div
              className={`rq-composer absolute left-0 right-0 bottom-0 flex flex-col gap-2 z-[4] ${
                sentTap ? "translate-y-[2px]" : ""
              }`}
              style={{
                padding: "12px 16px 18px",
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                background: "hsl(var(--card))",
                borderTop: "1px solid hsl(var(--border))",
                boxShadow: "0 -16px 32px -16px rgba(0,0,0,0.45)",
                transition: "transform 400ms cubic-bezier(0.22,0.61,0.36,1)",
              }}
            >
              <div
                className="self-center rounded-full"
                style={{
                  width: 36,
                  height: 4,
                  background: "hsl(var(--foreground))",
                  margin: "-4px 0 4px",
                }}
              />
              <div
                className="font-semibold"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.02em",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                {composerLead}
              </div>
              <div
                className="flex flex-col gap-1.5"
                style={{
                  border: `1px solid ${
                    phase === 1
                      ? "hsl(var(--primary))"
                      : "hsl(var(--border))"
                  }`,
                  borderRadius: 10,
                  padding: "10px 11px 8px",
                  background: "hsl(var(--background))",
                  transition: "border-color 240ms ease",
                }}
              >
                <div
                  className="leading-[1.5] whitespace-pre-wrap"
                  style={{ fontSize: 12.5, minHeight: 64 }}
                >
                  {typed || (
                    <span className="opacity-50">{placeholder}</span>
                  )}
                  {phase === 1 && typed.length < pitch.length && (
                    <span className="rq-caret" />
                  )}
                </div>
                <div
                  className="font-mono text-right"
                  style={{
                    fontSize: 10,
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  {typed.length} / 500
                </div>
              </div>
              <button
                type="button"
                tabIndex={-1}
                className="w-full rounded-lg font-semibold flex items-center justify-center gap-1.5"
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  transform: sentTap ? "scale(0.97)" : "none",
                  transition: "transform 120ms ease",
                }}
              >
                Send request
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
