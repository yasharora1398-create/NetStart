"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
 ArrowLeft,
 ArrowRight,
 Briefcase,
 Check,
 Clock,
 CreditCard,
 Eye,
 Globe,
 Layers,
 Loader2,
 Rocket,
 Star,
 Timer,
 User,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/netstart/AppLayout";
import { FadeUp } from "@/components/netstart/FadeUp";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const DURATION_HOURS = 72;

const Boost = () => {
 const { user } = useAuth();
 const [submitting, setSubmitting] = useState(false);

 const role = useMemo(() => {
 const r = user?.user_metadata?.role;
 return r === "founder" ? "founder" : "partner";
 }, [user]);
 const opposite = role === "founder" ? "partner" : "founder";

 // After Stripe redirects back to /boost?session_id=cs_xxx we POST
 // the id to /api/stripe/verify-session to actually grant the
 // boost. Strips the query param so a refresh doesn't re-trigger
 // (the endpoint is idempotent regardless, but clean URL is nicer).
 useEffect(() => {
 if (typeof window === "undefined") return;
 const params = new URLSearchParams(window.location.search);
 const sessionId = params.get("session_id");
 if (!sessionId) return;
 // Clean the URL early so a fast refresh doesn't loop.
 window.history.replaceState({}, "", window.location.pathname);
 void (async () => {
 try {
 const { data: sess } = await getSupabase().auth.getSession();
 const token = sess.session?.access_token;
 if (!token) {
 toast.error("Sign in to confirm your boost.");
 return;
 }
 const res = await fetch("/api/stripe/verify-session", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({ sessionId }),
 });
 const data = (await res.json()) as {
 ok?: boolean;
 alreadyGranted?: boolean;
 expiresAt?: string;
 error?: string;
 };
 if (!res.ok || !data.ok) {
 toast.error(data.error ?? "Could not confirm your boost.");
 return;
 }
 if (data.alreadyGranted) {
 toast.success("Boost already active.");
 } else {
 toast.success(
 `Boost activated. You're at the top for ${DURATION_HOURS} hours.`,
 );
 }
 } catch (err) {
 toast.error(
 err instanceof Error ? err.message : "Could not confirm your boost.",
 );
 }
 })();
 }, []);

 const handlePay = async () => {
 if (!user) return;
 setSubmitting(true);
 try {
 const { data: sess } = await getSupabase().auth.getSession();
 const token = sess.session?.access_token;
 if (!token) {
 throw new Error("Session expired. Sign in again.");
 }
 const res = await fetch("/api/stripe/checkout", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${token}`,
 },
 });
 const data = (await res.json()) as { url?: string; error?: string };
 if (!res.ok || !data.url) {
 throw new Error(data.error ?? "Could not start checkout.");
 }
 // Hard redirect to Stripe-hosted page. The browser carries the
 // user from here.
 window.location.href = data.url;
 } catch (err) {
 toast.error(
 err instanceof Error ? err.message : "Could not start checkout.",
 );
 setSubmitting(false);
 }
 };

 return (
 <AppLayout>
 <div className="container max-w-6xl py-6 md:py-10">
 <Link
 to="/match"
 className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6"
 >
 <ArrowLeft className="h-3.5 w-3.5" />
 Back to Match
 </Link>

 {/* HERO ------------------------------------------------------ */}
 {/* Two-column split: copy + price on the left, mockup of the
 deck-with-boosted-card on the right. Stacks on mobile.
 Both columns fade in; the right column is staggered slightly
 so the visual reveal feels intentional. */}
 <header className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 md:gap-14 items-center mb-16 md:mb-24">
 <FadeUp className="min-w-0">
 <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gold mb-4 flex items-center gap-2">
 <Rocket className="h-3.5 w-3.5" />
 Boost
 </p>
 <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[0.95] mb-5">
 Skip the queue.
 <br />
 <em className="text-gradient-gold not-italic">For fifty cents.</em>
 </h1>
 <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mb-7">
 Pin your card to the top of the {opposite} Match deck for{" "}
 <strong className="text-foreground">{DURATION_HOURS} hours</strong>.
 Every {opposite} who opens Match in that window sees you
 first. No algorithm guesswork, no waiting for the right
 moment.
 </p>

 <div className="flex items-end gap-3 mb-7">
 <div className="font-display text-7xl md:text-8xl leading-none transition-transform duration-300 hover:scale-105 origin-bottom-left">
 50¢
 </div>
 <div className="text-xs text-muted-foreground leading-tight pb-2">
 <span className="font-mono uppercase tracking-widest text-[10px] text-foreground block">
 USD
 </span>
 one-time
 <br />
 charge.
 <br />
 no sub.
 </div>
 </div>

 {user ? (
 <Button
 variant="gold"
 size="lg"
 onClick={handlePay}
 disabled={submitting}
 className="w-full sm:w-auto"
 >
 {submitting ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 Sending…
 </>
 ) : (
 <>
 Pay 50¢ and boost now
 <ArrowRight className="h-4 w-4" />
 </>
 )}
 </Button>
 ) : (
 <Link to="/signin">
 <Button variant="gold" size="lg" className="w-full sm:w-auto">
 Sign in to boost
 <ArrowRight className="h-4 w-4" />
 </Button>
 </Link>
 )}
 <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-3">
 {user
 ? `Activates on your ${role} side`
 : `Boost applies to whichever role you use`}
 </p>
 </FadeUp>

 {/* Right column: a pixel-for-pixel mock of how a boosted card
 appears at the top of the deck. Same border-2 border-primary,
 same primary header strip, same picture square + criteria pills
 as a real Polln8-recommended card in Match. */}
 <FadeUp delay={150}>
 <BoostedCardMockup opposite={opposite} />
 </FadeUp>
 </header>

 {/* WHAT IT DOES (3 stat tiles) ----------------------------- */}
 <section className="grid md:grid-cols-3 gap-4 mb-16 md:mb-24">
 <FadeUp>
 <StatTile
 icon={<Layers className="h-5 w-5" />}
 number="#1"
 label="Position in deck"
 detail={`First card every ${opposite} sees when they open Match.`}
 />
 </FadeUp>
 <FadeUp delay={100}>
 <StatTile
 icon={<Timer className="h-5 w-5" />}
 number={`${DURATION_HOURS}h`}
 label="Of priority"
 detail="Long enough to catch a weekend, short enough to stay fresh."
 />
 </FadeUp>
 <FadeUp delay={200}>
 <StatTile
 icon={<Eye className="h-5 w-5" />}
 number="100%"
 label={`Of ${opposite}s see you`}
 detail="Not a sample. Every active user in the window."
 />
 </FadeUp>
 </section>

 {/* HOW IT WORKS (3 steps with mini illustrations) ---------- */}
 <section className="mb-16 md:mb-24">
 <FadeUp>
 <div className="mb-10">
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
 How it works
 </p>
 <h2 className="font-display text-3xl md:text-5xl leading-[1.05] max-w-3xl">
 Three steps. Less than a minute.
 </h2>
 </div>
 </FadeUp>

 <div className="grid md:grid-cols-3 gap-4 md:gap-6">
 <FadeUp>
 <StepTile
 n="01"
 title="Pay 50¢ USD"
 body={`A single charge in US dollars. No subscription, no renewal, no surprise email next month.`}
 illustration={<PayIllustration />}
 />
 </FadeUp>
 <FadeUp delay={120}>
 <StepTile
 n="02"
 title="Your card pins"
 body={`Within seconds, your card jumps to position one of the ${opposite} Match deck.`}
 illustration={<PinIllustration />}
 />
 </FadeUp>
 <FadeUp delay={240}>
 <StepTile
 n="03"
 title="72 hours of eyes"
 body="Every viewer in that window starts with you. Then the boost expires automatically."
 illustration={<ClockIllustration />}
 />
 </FadeUp>
 </div>
 </section>

 {/* TIMELINE band -------------------------------------------- */}
 <FadeUp>
 <section className="mb-16 md:mb-24 rounded-sm border border-border bg-card p-6 md:p-10">
 <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-6">
 <div>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-2">
 The 72-hour window
 </p>
 <h2 className="font-display text-2xl md:text-3xl leading-tight">
 Pin, work, expire.
 </h2>
 </div>
 <p className="text-sm text-muted-foreground max-w-sm">
 Activates the instant payment clears. You don&apos;t have to
 schedule, configure, or remember to turn it off.
 </p>
 </div>
 <TimelineBar />
 </section>
 </FadeUp>

 {/* WHAT YOU GET (checklist + side card) -------------------- */}
 <section className="grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 md:gap-10 mb-16 md:mb-24">
 <FadeUp>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
 In the box
 </p>
 <h2 className="font-display text-3xl md:text-4xl mb-6 leading-tight">
 What you actually get for 50¢ USD.
 </h2>
 <ul className="space-y-3">
 <FeatureRow>
 Your card pinned to position one of the {opposite} Match
 deck for the full {DURATION_HOURS} hours.
 </FeatureRow>
 <FeatureRow>
 Every {opposite} who opens Match in that window sees you
 first, regardless of similarity score.
 </FeatureRow>
 <FeatureRow>
 Stacks on top of normal ranking, so the boost amplifies
 already-good matches rather than replacing them.
 </FeatureRow>
 <FeatureRow>
 One boost per account at a time. No queueing, no overlap.
 </FeatureRow>
 <FeatureRow>
 Automatic expiry. No subscription, no cancel-anytime, no
 dark-pattern renewal email at hour 71.
 </FeatureRow>
 </ul>
 </FadeUp>

 {/* Side compare card: "Without boost" vs "With boost" stat
 strip. Keeps the proof concrete instead of abstract copy. */}
 <FadeUp delay={150}>
 <CompareCard opposite={opposite} />
 </FadeUp>
 </section>

 {/* FAQ ----------------------------------------------------- */}
 <section className="mb-16">
 <FadeUp>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
 Honest answers
 </p>
 <h2 className="font-display text-3xl md:text-4xl mb-8 leading-tight">
 The questions we keep getting.
 </h2>
 </FadeUp>
 <div className="grid md:grid-cols-2 gap-4 md:gap-6">
 <Faq q={`Why ${DURATION_HOURS} hours?`}>
 Long enough to catch every {opposite} who logs in over a
 weekend, short enough to keep the slot fresh for the next
 person who wants it.
 </Faq>
 <Faq q="Why only 50 cents?">
 To filter for people who actually want the slot, without
 making cost the reason you can&apos;t get one.
 </Faq>
 <Faq q="Does this hurt non-boosted cards?">
 No. Boosts pin to position one; everyone else still ranks
 the same way they always have.
 </Faq>
 <Faq q="Can I boost more than once?">
 Yes. After your 72 hours expire you can buy another boost.
 You can&apos;t stack two at the same time.
 </Faq>
 <Faq q="Will partners know my card is boosted?">
 No badge, no ribbon, no asterisk. The pin is invisible to
 viewers; you just sit at position one.
 </Faq>
 <Faq q="Refunds?">
 If something breaks on our end, message us and we&apos;ll
 refund without asking why.
 </Faq>
 </div>
 </section>

 {/* FINAL CTA ----------------------------------------------- */}
 <FadeUp>
 <section className="rounded-sm border-2 border-gold bg-card p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
 <div className="min-w-0">
 <h2 className="font-display text-3xl md:text-4xl leading-tight mb-2">
 Fifty cents USD. Top of the deck.
 </h2>
 <p className="text-sm text-muted-foreground max-w-md">
 The next {opposite} who opens Match could be the one. Make
 sure they start with you.
 </p>
 </div>
 {/* Outline variant here so the page only carries one
 primary (gold) button - the hero one - per the design
 rules. This is a reminder of the same action. */}
 <a
 href="#top"
 onClick={(e) => {
 e.preventDefault();
 window.scrollTo({ top: 0, behavior: "smooth" });
 }}
 className="flex-shrink-0"
 >
 <Button variant="outline" size="lg">
 Back to the button
 <ArrowRight className="h-4 w-4" />
 </Button>
 </a>
 </section>
 </FadeUp>
 </div>
 </AppLayout>
 );
};

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
// Illustrations & supporting bits. Built from SVG / lucide so they
// scale and inherit the theme palette without dragging in image
// assets.

// Pixel-for-pixel mock of a Polln8-recommended card as it appears
// at the top of the Match deck. Mirrors MatchProjectCard's structure
// in src/views/Match.tsx so the visual reads as the actual product
// surface: external website strip on top, then the article with the
// "Recommended by Polln8" header bar, picture square with silhouette,
// title, and criteria pills.
const BoostedCardMockup = ({ opposite }: { opposite: string }) => (
 <div className="relative w-full max-w-md mx-auto">
 {/* Eyebrow above the card pointing into it. Establishes that
 this is the boosted position-#1 card. */}
 <div className="flex items-center gap-2 mb-3 ml-1">
 <Rocket className="h-3.5 w-3.5 text-primary animate-bounce" />
 <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
 Position #1 in the {opposite} deck
 </span>
 </div>

 {/* Faux external website link strip - real recommended cards
 show this above the card when the founder ships a public URL. */}
 <div className="inline-flex items-center gap-2 self-start font-display text-2xl md:text-3xl font-bold tracking-tight text-primary mb-3 break-all">
 <Globe className="h-5 w-5 flex-shrink-0" />
 yourstartup.com
 </div>

 <article className="overflow-hidden rounded-2xl bg-card shadow-sm border-2 border-primary">
 {/* Recommended-by header strip - same primary fill + text as
 the real card. */}
 <div className="bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
 Recommended by Polln8
 </div>

 {/* Picture square - 4:3 muted background with the silhouette
 fallback, identical to MatchProjectCard's no-avatar path. */}
 <div className="relative w-full aspect-[4/3] bg-muted">
 <div className="absolute inset-0 flex items-center justify-center">
 <User
 className="h-32 w-32 text-muted-foreground"
 strokeWidth={1.4}
 />
 </div>
 </div>

 {/* Body: title only, no founder byline (matches the real
 card per the prior "deck is about the venture" change). */}
 <div className="p-5">
 <h3 className="mb-3 font-display text-2xl leading-tight text-foreground">
 Your startup name
 </h3>
 <div className="flex flex-wrap gap-1.5 mb-3">
 <span className="px-2 py-0.5 text-xs rounded-sm border border-gold bg-gold text-primary-foreground">
 Full-time
 </span>
 <span className="px-2 py-0.5 text-xs rounded-sm border border-gold bg-gold text-primary-foreground">
 Remote
 </span>
 </div>
 <p className="text-sm text-muted-foreground leading-relaxed">
 The one-line pitch that hooks the {opposite}. Two sentences
 max so they can decide if they want to swipe right.
 </p>
 </div>
 </article>

 {/* Footer caption beneath the card - tells the reader this
 is the boosted view, not just a static screenshot. */}
 <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-3 text-center">
 What every {opposite} sees first, for 72 hours.
 </p>
 </div>
);

const StatTile = ({
 icon,
 number,
 label,
 detail,
}: {
 icon: React.ReactNode;
 number: string;
 label: string;
 detail: string;
}) => (
 <div className="group rounded-sm border border-border bg-card p-6 md:p-7 transition-all duration-300 hover:border-gold hover:-translate-y-1">
 <div className="flex items-center gap-2 mb-4 text-gold transition-transform duration-300 group-hover:scale-110 origin-left">
 {icon}
 </div>
 <p className="font-display text-5xl md:text-6xl leading-none mb-2">
 {number}
 </p>
 <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground mb-3">
 {label}
 </p>
 <p className="text-sm text-muted-foreground leading-relaxed">
 {detail}
 </p>
 </div>
);

const StepTile = ({
 n,
 title,
 body,
 illustration,
}: {
 n: string;
 title: string;
 body: string;
 illustration: React.ReactNode;
}) => (
 <div className="group rounded-sm border border-border bg-card overflow-hidden flex flex-col transition-all duration-300 hover:border-gold hover:-translate-y-1">
 <div className="relative bg-muted h-40 flex items-center justify-center overflow-hidden">
 <div className="transition-transform duration-500 group-hover:scale-110">
 {illustration}
 </div>
 <span className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
 {n}
 </span>
 </div>
 <div className="p-5 md:p-6">
 <h3 className="font-display text-xl mb-2">{title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
 </div>
 </div>
);

const PayIllustration = () => (
 <div className="relative w-32 h-24">
 <div className="absolute inset-0 rounded-sm border-2 border-gold bg-card flex items-center justify-center">
 <CreditCard className="h-10 w-10 text-gold" strokeWidth={1.5} />
 </div>
 <div className="absolute -bottom-2 -right-2 rounded-full bg-primary text-primary-foreground h-9 w-9 flex items-center justify-center text-xs font-bold">
 50¢
 </div>
 </div>
);

const PinIllustration = () => (
 <div className="relative w-40 h-24">
 {/* Three thin card silhouettes; the top one breaks out of the
 stack to convey "pinned." */}
 <div className="absolute top-6 left-4 right-4 h-3 rounded-sm bg-border" />
 <div className="absolute top-12 left-6 right-6 h-3 rounded-sm bg-border" />
 <div className="absolute top-0 left-0 right-0 flex items-center gap-2">
 <div className="flex-1 h-5 rounded-sm bg-primary" />
 <Rocket className="h-4 w-4 text-primary" />
 </div>
 </div>
);

const ClockIllustration = () => (
 <div className="relative w-24 h-24 flex items-center justify-center">
 <div className="absolute inset-0 rounded-full border-2 border-gold" />
 <Clock className="h-12 w-12 text-gold" strokeWidth={1.5} />
 </div>
);

// Horizontal bar showing the 72-hour boost lifespan with markers at
// 0 / 24 / 48 / 72. Solid gold fill (no gradient) that animates from
// 0% to 100% width when scrolled into view, so the bar visually
// "spends" the 72 hours as the section enters.
const TimelineBar = () => {
 const ref = useRef<HTMLDivElement | null>(null);
 const [filled, setFilled] = useState(false);
 useEffect(() => {
 const el = ref.current;
 if (!el) return;
 const reduce = window.matchMedia(
 "(prefers-reduced-motion: reduce)",
 ).matches;
 if (reduce) {
 setFilled(true);
 return;
 }
 const io = new IntersectionObserver(
 ([entry]) => {
 if (entry.isIntersecting) {
 setFilled(true);
 io.disconnect();
 }
 },
 { threshold: 0.4 },
 );
 io.observe(el);
 return () => io.disconnect();
 }, []);
 return (
 <div className="pt-4" ref={ref}>
 <div className="relative h-3 rounded-full bg-muted overflow-hidden">
 <div
 className={cn(
 "absolute inset-y-0 left-0 bg-gold transition-[width] duration-[1800ms] ease-out",
 filled ? "w-full" : "w-0",
 )}
 />
 </div>
 <div className="flex justify-between mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
 <span>0h · pin lands</span>
 <span className="hidden sm:inline">24h</span>
 <span className="hidden sm:inline">48h</span>
 <span>72h · expires</span>
 </div>
 </div>
 );
};

const CompareCard = ({ opposite }: { opposite: string }) => (
 <div className="rounded-sm border border-border bg-card overflow-hidden">
 <div className="px-5 py-3 border-b border-border">
 <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
 Same {opposite} opens Match
 </p>
 </div>
 <div className="grid grid-cols-2 divide-x divide-border">
 <div className="p-5">
 <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
 Without boost
 </p>
 <p className="font-display text-3xl md:text-4xl mb-2">~14</p>
 <p className="text-xs text-muted-foreground leading-relaxed">
 cards before they reach yours, on average.
 </p>
 </div>
 <div className="p-5 bg-muted">
 <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-2 flex items-center gap-1">
 <Star className="h-3 w-3" />
 With boost
 </p>
 <p className="font-display text-3xl md:text-4xl mb-2">1</p>
 <p className="text-xs text-foreground leading-relaxed">
 first card they see is yours.
 </p>
 </div>
 </div>
 <div className="px-5 py-3 border-t border-border flex items-center gap-2">
 <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
 <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
 Estimate based on current deck depth
 </p>
 </div>
 </div>
);

const FeatureRow = ({ children }: { children: React.ReactNode }) => (
 <li className="flex items-start gap-2.5">
 <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
 <span className="text-sm text-foreground leading-relaxed">{children}</span>
 </li>
);

const Faq = ({ q, children }: { q: string; children: React.ReactNode }) => (
 <div className="rounded-sm border border-border bg-card p-5 transition-colors duration-300 hover:border-gold">
 <dt className="font-medium text-foreground mb-1.5">{q}</dt>
 <dd className="text-sm text-muted-foreground leading-relaxed">{children}</dd>
 </div>
);

export default Boost;
