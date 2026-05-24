"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight, BadgeCheck, Check, Sparkles, Zap } from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useInView } from "@/hooks/useInView";
import { usePageMeta } from "@/hooks/usePageMeta";

type MockupKind = "review" | "matches" | "request" | "placeholder";

const WHY: {
 icon: typeof BadgeCheck;
 title: string;
 body: string;
 details: string[];
 mockup: MockupKind;
}[] = [
 {
 icon: BadgeCheck,
 title: "Vetted, not viral.",
 body: "Every member reviewed for shipped work. No accounts farmed for engagement.",
 details: [
 "Manual review of every signup, not auto-approval.",
 "LinkedIn + resume cross-checked against public work.",
 "Rejected applicants get a reviewer note and a resubmit path.",
 ],
 mockup: "review",
 },
 {
 icon: Sparkles,
 title: "Matches ranked by AI.",
 body: "The deck is ordered against your skills, project, and intent. Not the algorithm's.",
 details: [
 "Embeddings of your profile + project intent drive ranking.",
 "Skills weighted by what you've actually shipped, not claimed.",
 "Re-ranks daily as profiles and projects update.",
 ],
 mockup: "matches",
 },
 {
 icon: Zap,
 title: "Decisive by design.",
 body: "Connect, save, or pass. No likes, no maybes. Apply with one real pitch.",
 details: [
 "Three actions per card. No fourth option to defer.",
 "One pitch per application - no copy-paste spam.",
 "Accepted requests turn into mutual contacts immediately.",
 ],
 mockup: "request",
 },
];

const Index = () => {
 usePageMeta({
 title: "Polln8 | Cofounders found efficiently",
 description:
 "Cofounders found efficiently. Polln8 matches founders with vetted technical cofounders and founding engineers, and matches partners with early-stage startups worth joining.",
 path: "/",
 });
 const { user } = useAuth();

 return (
 <div
 className="min-h-screen bg-background text-foreground"
 style={{ overflowX: "clip" }}
 >
 <Sidebar />
 <div
 className="transition-[padding] duration-300"
 style={{ paddingLeft: "var(--sidebar-width, 248px)" }}
 >
 <div className="max-w-6xl mx-auto px-6 md:px-10">
 {/* HERO */}
 <Reveal>
 <section className="pt-6 md:pt-12 pb-12 md:pb-16 max-w-3xl">
 <p className="font-mono text-[11px] uppercase tracking-[0.3em] mb-5 text-primary">
 polln8 / for partners
 </p>
 <h1 className="font-display text-4xl md:text-6xl lg:text-[6rem] leading-[0.92] tracking-[-0.03em] mb-5 text-foreground font-bold">
 The mobile app for people who actually
 <span className="italic text-primary"> build.</span>
 </h1>
 <p className="text-base md:text-lg max-w-md mb-8 leading-relaxed text-muted-foreground">
 Vetted founders and partners. Matches ranked by AI. Connect, pass,
 or save. No maybes.
 </p>
 <div className="flex flex-wrap items-center gap-4">
 {user ? (
 <Link to="/mynet">
 <PrimaryButton>Open MyNet</PrimaryButton>
 </Link>
 ) : (
 <>
 <Link to="/signup">
 <PrimaryButton>Sign up free</PrimaryButton>
 </Link>
 <Link
 to="/signin"
 className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
 >
 Sign in
 </Link>
 </>
 )}
 </div>
 </section>
 </Reveal>

 {/* WHY - three reasons, each as a row with text on the left
 and an animated demo mockup on the right. Hover the row
 to play the mockup's motion (waiting check-in, swipe deck,
 apply-and-chat). */}
 <section className="py-10 md:py-14 space-y-20 md:space-y-28">
 {WHY.map((w) => (
 <Reveal key={w.title}>
 <WhyRow entry={w} />
 </Reveal>
 ))}
 </section>

 {/* HOW - single line flow */}
 <Reveal delay={120}>
 <section className="py-10 md:py-14">
 <div className="grid md:grid-cols-[160px_1fr] gap-6 md:gap-12 items-baseline">
 <Link
 to="/how"
 className="group inline-flex items-start gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-primary transition-colors"
 >
 How it works
 <ArrowRight className="h-3 w-3 mt-0.5 transition-transform group-hover:translate-x-0.5" />
 </Link>
 <p className="font-display text-2xl md:text-4xl tracking-[-0.02em] leading-[1.15] max-w-3xl text-foreground font-bold">
 Sign up. Verify. Match.{" "}
 <span className="italic text-primary">Build.</span>
 </p>
 </div>
 </section>
 </Reveal>

 {/* CLOSING CTA - alt-section panel */}
 <Reveal>
 <section className="py-12 md:py-16">
 <div className="p-8 md:p-12 bg-secondary border border-border rounded-2xl">
 <div className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-16 items-end">
 <div>
 <p className="font-mono text-[11px] uppercase tracking-[0.3em] mb-4 inline-flex items-center gap-2 text-primary">
 <span
 className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
 style={{ boxShadow: "0 0 8px hsl(var(--primary) / 0.55)" }}
 />
 Apply to join
 </p>
 <h2 className="font-display text-3xl md:text-5xl tracking-[-0.025em] leading-[1] mb-3 text-foreground font-bold">
 Partners,
 <br />
 <span className="italic text-muted-foreground">
 not talkers.
 </span>
 </h2>
 <p className="text-sm md:text-base max-w-md leading-relaxed text-muted-foreground">
 Free to apply. Quick manual review.
 </p>
 </div>
 <div className="flex flex-col gap-2.5 min-w-[220px]">
 {user ? (
 <Link to="/mynet">
 <CtaButton primary label="Open MyNet" sub="Continue" />
 </Link>
 ) : (
 <>
 <Link to="/signup">
 <CtaButton
 primary
 label="Sign up free"
 sub="Free to apply"
 />
 </Link>
 <Link to="/download">
 <CtaButton label="Get the app" sub="iOS & Android" />
 </Link>
 </>
 )}
 </div>
 </div>
 </div>
 </section>
 </Reveal>

 <footer className="mt-4 mb-6 pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.25em] border-t border-border text-muted-foreground">
 <p>© Polln8</p>
 <div className="flex gap-6">
 <Link to="/how" className="transition-colors hover:text-foreground">
 How it works
 </Link>
 <Link
 to="/standards"
 className="transition-colors hover:text-foreground"
 >
 Standards
 </Link>
 <Link
 to="/download"
 className="transition-colors hover:text-foreground"
 >
 Download
 </Link>
 </div>
 </footer>
 </div>
 </div>
 </div>
 );
};

// Fade-up + un- as the wrapped block enters the viewport. Uses
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

// Each WHY row: text block on the left, mockup on the right. The
// text block is its own hover group - hovering it reveals the
// expanded details list using the grid-rows-[0fr]->[1fr] trick (same
// pattern the Waitlist pillars used originally before being switched
// to scroll-reveal).
const WhyRow = ({ entry }: { entry: (typeof WHY)[number] }) => {
 const Icon = entry.icon;
 return (
 <article className="grid md:grid-cols-[38fr_62fr] gap-10 md:gap-16 items-center">
 <div className="group cursor-default">
 <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg mb-5 bg-primary border border-primary text-primary">
 <Icon className="h-4 w-4" />
 </div>
 <h3 className="font-display text-2xl md:text-3xl mb-3 tracking-[-0.02em] text-foreground font-bold">
 {entry.title}
 </h3>
 <p className="text-base leading-relaxed text-muted-foreground max-w-md">
 {entry.body}
 </p>
 <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out">
 <div className="overflow-hidden">
 <ul className="space-y-2 border-l border-primary pl-4 mt-5 max-w-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
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
 <div className="flex justify-center md:justify-end">
 {entry.mockup === "review" && <ReviewCardMockup />}
 {entry.mockup === "matches" && <MatchesCardMockup />}
 {entry.mockup === "request" && <RequestCardMockup />}
 {entry.mockup === "placeholder" && <MockupPlaceholder />}
 </div>
 </article>
 );
};

// Slot for a video the user is going to drop in later. Visually
// quiet so it doesn't compete with the live mockup above; just a
// dashed-border 16:12 panel with a small "Video coming" label.
const MockupPlaceholder = () => (
 <div
 className="relative w-full max-w-[440px] rounded-2xl border border-dashed border-border bg-card flex items-center justify-center"
 style={{ aspectRatio: "16 / 12" }}
 aria-hidden
 >
 <div className="text-center px-6">
 <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
 Demo · Video coming
 </p>
 <p className="text-sm text-muted-foreground">
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
 "inset 0 0 0 1px hsl(var(--foreground) / 0.08), 0 30px 60px -24px rgba(0,0,0,0.45), 0 12px 24px -12px rgba(0,0,0,0.25)",
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
 style={{ borderBottom: "1px solid hsl(var(--foreground) / 0.08)" }}
 >
 <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
 application · step 3 of 3
 </span>
 <span
 className="ml-auto font-mono text-[11px] tracking-[0.04em] text-muted-foreground px-2 py-0.5 rounded"
 style={{ border: "1px solid hsl(var(--foreground) / 0.16)" }}
 >
 #1284
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
 style={{ borderRight: "1px solid hsl(var(--foreground) / 0.08)", paddingRight: "clamp(20px, 4%, 36px)" }}
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
 : "hsl(var(--foreground) / 0.45)"
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
 style={{ borderTop: "1px dashed hsl(var(--foreground) / 0.08)" }}
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
 ? "hsl(var(--foreground) / 0.16)"
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
 : "hsl(var(--foreground) / 0.16)",
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
 ? "hsl(var(--foreground) / 0.5)"
 : "hsl(var(--foreground) / 0.2)",
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
// 0 rest - Maya on top, Ravi behind
// 1 maya-swiping - Maya swipes right (Save)
// 2 detail-tab-open - Maya's profile sheet slides up
// 3 detail+next - sheet still open, Ravi grows behind
// 4 ravi-swiping - sheet retracts, Ravi swipes left (Pass)
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

const MatchesCardMockup = () => {
 const [phase, setPhase] = useState(0);
 const timers = useRef<number[]>([]);
 // 5 phases - two-person flow per the user's spec:
 // 0 ravi rest (first person shown)
 // 1 ravi swipes left (skip - translates + fades)
 // 2 maya rest (second person, now on top)
 // 3 maya swipes right (save - slides off)
 // 4 info sheet up (Maya's projects, LinkedIn, résumé)
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

 const raviFront: Frontness = (
 ["top", "swiping-left", "gone-left", "gone-left", "gone-left"] as const
 )[phase];
 const mayaFront: Frontness = (
 ["behind1", "behind1", "top", "swiping-right", "gone-right"] as const
 )[phase];

 const hint =
 phase === 1
 ? "Passed - won't show again"
 : phase === 3
 ? "Saving - opening profile"
 : phase === 4
 ? "Maya C. · profile open"
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
 "inset 0 0 0 1px hsl(var(--foreground) / 0.06), 0 30px 60px -24px rgba(0,0,0,0.45), 0 12px 24px -12px rgba(0,0,0,0.25)",
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
 <span className="text-[12px] px-3 py-1 rounded-full ">
 Saved
 </span>
 </span>
 <span className="justify-self-end">
 <span
 className="font-mono text-[11px] tracking-[0.04em] px-2 py-1 rounded-md"
 style={{
 background: "hsl(var(--primary) / 0.12)",
 color: "hsl(var(--primary))",
 }}
 >
 12 / 24
 </span>
 </span>
 </div>

 {/* Deck area - two cards plus the profile-detail sheet that
 slides up when Maya is right-swiped. No edge glows; left
 swipes just fade out and right swipes hand off to the
 sheet. */}
 <div className="relative flex-1 flex items-center justify-center overflow-hidden p-6">
 <ProfileCardMockup profile={RAVI} frontness={raviFront} />
 <ProfileCardMockup profile={MAYA} frontness={mayaFront} />

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
 background: "hsl(var(--foreground) / 0.18)",
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
 Maya C.
 </div>
 <div className=" mt-0.5" style={{ fontSize: 11 }}>
 Founder · Remote · Full-time
 </div>
 </div>

 <div>
 <div
 className="font-mono uppercase mb-1.5 "
 style={{ fontSize: 9, letterSpacing: "0.12em" }}
 >
 Currently building
 </div>
 <div className="flex flex-col gap-2">
 <ProjectRow
 name="Pollenboard"
 tag="Shipped"
 desc="Design system for indie tooling - v2 live, used by 40+ small teams."
 />
 <ProjectRow
 name="Toolspace"
 tag="Beta"
 desc="Async pairing app for solo founders. MVP shipped in March."
 />
 </div>
 </div>

 <div>
 <div
 className="font-mono uppercase mb-1.5 "
 style={{ fontSize: 9, letterSpacing: "0.12em" }}
 >
 Links
 </div>
 <div className="flex flex-col gap-1.5">
 <LinkRow icon="in" label="LinkedIn" url="/in/mayac" />
 <LinkRow icon="PDF" label="Résumé" url="maya-c.pdf" />
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
 color: "hsl(var(--primary))",
 border: "1px solid hsl(var(--primary) / 0.4)",
 background: "hsl(var(--primary) / 0.10)",
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
}: {
 profile: ProfileEntry;
 frontness: Frontness;
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
 background: "hsl(var(--primary) / 0.10)",
 color: "hsl(var(--primary))",
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
 background: "hsl(var(--primary) / 0.12)",
 color: "hsl(var(--primary))",
 border: "1px solid hsl(var(--primary) / 0.3)",
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
 Apply
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
 background: "hsl(var(--foreground) / 0.035)",
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
 background: "hsl(var(--primary) / 0.12)",
 color: "hsl(var(--primary))",
 }}
 >
 {tag}
 </span>
 <span
 className=" leading-snug col-span-full"
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
 background: "hsl(var(--foreground) / 0.04)",
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
 background: "hsl(var(--primary) / 0.12)",
 color: "hsl(var(--primary))",
 }}
 >
 {icon}
 </span>
 <span>{label}</span>
 </span>
 <span
 className="font-mono "
 style={{ fontSize: 10 }}
 >
 {url}
 </span>
 </div>
);

// ─── Polln8 Request Card mockup ─────────────────────────────────
// Direct port of the Polln8 Request Card.html design from the
// Anthropic design handoff. 4-phase auto-loop:
// 0 rest - profile card with Apply CTA pulsing
// 1 composer - sheet slides up, pitch types in character-by-char
// 2 sent - sheet drops, status pill "Request sent" + glow
// 3 accepted - pill flips green "Accepted", solid ring on
// avatar, Open chat reveals
const REQUEST_PROFILE = {
 monogram: "JK",
 name: "Jamie K.",
 pills: ["Full-time", "SF", "Founder"],
 skills: ["Product", "Sales", "Fundraising"],
 headline:
 "Building a B2B platform for restaurant partners. $40K MRR, looking for a technical cofounder to lead engineering.",
};
const REQUEST_PITCH =
 "I've shipped two B2B products in restaurant tech. Saw your MRR growth - I think I can help you cross $100K and lead the engineering build-out. Free to talk this week.";

const RequestCardMockup = () => {
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
 const step = Math.max(18, lens[1] / Math.max(1, REQUEST_PITCH.length + 6));
 let i = 0;
 const typer = () => {
 if (!alive) return;
 i += 1;
 setTyped(REQUEST_PITCH.slice(0, i));
 if (i < REQUEST_PITCH.length) {
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
 }, []);

 const sentTap = phase === 1 && typed.length === REQUEST_PITCH.length;

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
 "inset 0 0 0 1px hsl(var(--foreground) / 0.06), 0 30px 60px -24px rgba(0,0,0,0.45), 0 12px 24px -12px rgba(0,0,0,0.25)",
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
 className="px-2.5 py-1 rounded-full "
 style={{ fontSize: 11 }}
 >
 Saved
 </span>
 </span>
 <span className="justify-self-end">
 <span
 className="font-mono px-2 py-0.5 rounded-md"
 style={{
 fontSize: 10.5,
 background: "hsl(var(--primary) / 0.12)",
 color: "hsl(var(--primary))",
 }}
 >
 12 / 24
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
 ? "0 0 0 1px hsl(var(--primary)), 0 0 60px hsl(var(--primary) / 0.30)"
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
 background: "hsl(var(--primary) / 0.12)",
 color: "hsl(var(--primary))",
 fontSize: 12,
 boxShadow:
 phase === 3
 ? "0 0 0 2px hsl(var(--primary))"
 : phase === 2
 ? "0 0 0 2px hsl(var(--primary) / 0.45)"
 : "none",
 transition: "box-shadow 280ms ease",
 }}
 >
 {REQUEST_PROFILE.monogram}
 </div>
 <div
 className="font-semibold tracking-tight"
 style={{ fontSize: 16 }}
 >
 {REQUEST_PROFILE.name}
 </div>
 </div>

 <div className="flex flex-wrap gap-1.5">
 {REQUEST_PROFILE.pills.map((p) => (
 <span
 key={p}
 className="font-medium leading-[1.5]"
 style={{
 fontSize: 11,
 padding: "3px 8px",
 borderRadius: 999,
 background: "hsl(var(--primary) / 0.12)",
 color: "hsl(var(--primary))",
 border: "1px solid hsl(var(--primary) / 0.30)",
 }}
 >
 {p}
 </span>
 ))}
 </div>
 <div className="flex flex-wrap gap-1.5 -mt-1">
 {REQUEST_PROFILE.skills.map((s) => (
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
 {REQUEST_PROFILE.headline}
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
 Apply
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
 Apply
 </button>
 )}
 {phase === 2 && (
 <div
 className="w-full rounded-lg font-semibold flex items-center justify-center gap-1.5"
 style={{
 padding: "10px 14px",
 fontSize: 13,
 background: "hsl(var(--primary) / 0.12)",
 color: "hsl(var(--primary))",
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
 You&apos;ll get notified when Jamie responds.
 </div>
 )}
 {phase === 3 && (
 <div className="flex flex-col gap-2 mt-1">
 <div
 className="text-center font-medium"
 style={{ fontSize: 12 }}
 >
 Mutual contact. Message Jamie now.
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
 background: "hsl(var(--foreground) / 0.18)",
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
 One pitch. One shot.
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
 <span className="">
 Tell Jamie why you&apos;d be the right person to build this with...
 </span>
 )}
 {phase === 1 && typed.length < REQUEST_PITCH.length && (
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

const PrimaryButton = ({ children }: { children: React.ReactNode }) => (
 <button
 type="button"
 className="group inline-flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-lg bg-primary text-primary-foreground transition-opacity"
 style={{ boxShadow: "0 2px 8px hsl(var(--primary) / 0.3)" }}
 >
 {children}
 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
 </button>
);

const CtaButton = ({
 label,
 sub,
 primary = false,
}: {
 label: string;
 sub: string;
 primary?: boolean;
}) => (
 <span
 className={`group flex items-center gap-3 transition-all min-w-[220px] cursor-pointer rounded-lg ${
 primary
 ? "bg-primary text-primary-foreground px-5 py-3"
 : "bg-card text-foreground border-[1.5px] border-primary px-5 py-[10.5px]"
 }`}
 style={
 primary
 ? { boxShadow: "0 2px 8px hsl(var(--primary) / 0.3)" }
 : undefined
 }
 >
 <span className="text-sm font-medium block flex-1">
 <span className="block leading-tight">{label}</span>
 <span className="block text-[10px] font-mono uppercase tracking-[0.18em] mt-0.5 ">
 {sub}
 </span>
 </span>
 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
 </span>
);

export default Index;
