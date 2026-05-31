"use client";
import { useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
 ArrowLeft,
 ArrowRight,
 Briefcase,
 Check,
 Clock,
 CreditCard,
 Eye,
 Layers,
 Loader2,
 MapPin,
 Rocket,
 Star,
 Timer,
 User,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/netstart/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const PRICE_CENTS = 10;
const DURATION_HOURS = 72;

const Boost = () => {
 const { user } = useAuth();
 const [submitting, setSubmitting] = useState(false);

 const role = useMemo(() => {
 const r = user?.user_metadata?.role;
 return r === "founder" ? "founder" : "partner";
 }, [user]);
 const opposite = role === "founder" ? "partner" : "founder";

 const handlePay = async () => {
 if (!user) return;
 setSubmitting(true);
 await new Promise((r) => setTimeout(r, 600));
 setSubmitting(false);
 toast.info(
 "Stripe isn't wired up yet. The boost will activate once payment is connected.",
 );
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
 deck-with-boosted-card on the right. Stacks on mobile. */}
 <header className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 md:gap-14 items-center mb-16 md:mb-24">
 <div className="min-w-0">
 <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gold mb-4 flex items-center gap-2">
 <Rocket className="h-3.5 w-3.5" />
 Boost
 </p>
 <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[0.95] mb-5">
 Skip the queue.
 <br />
 <em className="text-gradient-gold not-italic">For ten cents.</em>
 </h1>
 <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mb-7">
 Pin your card to the top of the {opposite} Match deck for{" "}
 <strong className="text-foreground">{DURATION_HOURS} hours</strong>.
 Every {opposite} who opens Match in that window sees you
 first. No algorithm guesswork, no waiting for the right
 moment.
 </p>

 <div className="flex items-center gap-3 mb-7">
 <div className="font-display text-7xl md:text-8xl leading-none">
 10¢
 </div>
 <div className="text-xs text-muted-foreground leading-tight">
 one-time
 <br />
 charge.
 <br />
 no
 <br />
 sub.
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
 Pay 10¢ and boost now
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
 </div>

 {/* Right column: mocked Match deck with one boosted card on
 top. Built from the same visual vocabulary as the real
 cards so it feels like the actual product. */}
 <BoostedDeckMockup opposite={opposite} />
 </header>

 {/* WHAT IT DOES (3 stat tiles) ----------------------------- */}
 <section className="grid md:grid-cols-3 gap-4 mb-16 md:mb-24">
 <StatTile
 icon={<Layers className="h-5 w-5" />}
 number="#1"
 label="Position in deck"
 detail={`First card every ${opposite} sees when they open Match.`}
 />
 <StatTile
 icon={<Timer className="h-5 w-5" />}
 number={`${DURATION_HOURS}h`}
 label="Of priority"
 detail="Long enough to catch a weekend, short enough to stay fresh."
 />
 <StatTile
 icon={<Eye className="h-5 w-5" />}
 number="100%"
 label={`Of ${opposite}s see you`}
 detail="Not a sample. Every active user in the window."
 />
 </section>

 {/* HOW IT WORKS (3 steps with mini illustrations) ---------- */}
 <section className="mb-16 md:mb-24">
 <div className="mb-10">
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
 How it works
 </p>
 <h2 className="font-display text-3xl md:text-5xl leading-[1.05] max-w-3xl">
 Three steps. Less than a minute.
 </h2>
 </div>

 <div className="grid md:grid-cols-3 gap-4 md:gap-6">
 <StepTile
 n="01"
 title="Pay 10¢"
 body={`A single charge. No subscription, no renewal, no surprise email next month.`}
 illustration={<PayIllustration />}
 />
 <StepTile
 n="02"
 title="Your card pins"
 body={`Within seconds, your card jumps to position one of the ${opposite} Match deck.`}
 illustration={<PinIllustration />}
 />
 <StepTile
 n="03"
 title="72 hours of eyes"
 body="Every viewer in that window starts with you. Then the boost expires automatically."
 illustration={<ClockIllustration />}
 />
 </div>
 </section>

 {/* TIMELINE band -------------------------------------------- */}
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

 {/* WHAT YOU GET (checklist + side card) -------------------- */}
 <section className="grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 md:gap-10 mb-16 md:mb-24">
 <div>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
 In the box
 </p>
 <h2 className="font-display text-3xl md:text-4xl mb-6 leading-tight">
 What you actually get for 10¢.
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
 </div>

 {/* Side compare card: "Without boost" vs "With boost" stat
 strip. Keeps the proof concrete instead of abstract copy. */}
 <CompareCard opposite={opposite} />
 </section>

 {/* FAQ ----------------------------------------------------- */}
 <section className="mb-16">
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
 Honest answers
 </p>
 <h2 className="font-display text-3xl md:text-4xl mb-8 leading-tight">
 The questions we keep getting.
 </h2>
 <div className="grid md:grid-cols-2 gap-4 md:gap-6">
 <Faq q={`Why ${DURATION_HOURS} hours?`}>
 Long enough to catch every {opposite} who logs in over a
 weekend, short enough to keep the slot fresh for the next
 person who wants it.
 </Faq>
 <Faq q="Why only 10 cents?">
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
 <section className="rounded-sm border-2 border-gold bg-card p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
 <div className="min-w-0">
 <h2 className="font-display text-3xl md:text-4xl leading-tight mb-2">
 Ten cents. Top of the deck.
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
 </div>
 </AppLayout>
 );
};

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
// Illustrations & supporting bits. Built from SVG / lucide so they
// scale and inherit the theme palette without dragging in image
// assets.

const BoostedDeckMockup = ({ opposite }: { opposite: string }) => (
 <div className="relative h-[420px] md:h-[460px]">
 {/* Two muted background cards stacked behind so the top card
 reads as "first in the deck." Solid (no opacity); the
 muted variant alone carries the "this is behind" cue via
 border-border + muted-foreground text. */}
 <MockCard
 className="absolute top-12 left-6 right-12"
 muted
 title="Another startup"
 sub="Founder, NYC"
 />
 <MockCard
 className="absolute top-6 left-3 right-9"
 muted
 title="An earlier card"
 sub={`${opposite === "founder" ? "Partner" : "Founder"}, remote`}
 />
 {/* The boosted card. Sits on top with a thicker primary border
 and a small "BOOSTED" eyebrow above it pointing into the
 card. */}
 <div className="absolute top-0 left-0 right-6">
 <div className="flex items-center gap-2 mb-2 ml-1">
 <Rocket className="h-3.5 w-3.5 text-primary" />
 <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
 Boosted to position #1
 </span>
 </div>
 <MockCard
 className="border-2 border-primary"
 title="You"
 sub={`Your ${opposite === "founder" ? "partner" : "founder"} card`}
 highlight
 />
 </div>
 </div>
);

const MockCard = ({
 className,
 title,
 sub,
 muted = false,
 highlight = false,
}: {
 className?: string;
 title: string;
 sub: string;
 muted?: boolean;
 highlight?: boolean;
}) => (
 <div
 className={cn(
 "rounded-2xl bg-card overflow-hidden shadow-sm",
 muted ? "border border-border" : "border border-gold",
 className,
 )}
 >
 {/* Faux avatar/header area. Solid muted square so it reads as
 a real card without needing actual imagery. */}
 <div className="relative aspect-[4/3] bg-muted flex items-center justify-center">
 <User
 className={cn(
 "h-20 w-20",
 highlight ? "text-primary" : "text-muted-foreground",
 )}
 strokeWidth={1.2}
 />
 </div>
 <div className="p-4">
 <p
 className={cn(
 "font-display text-lg leading-tight mb-1",
 muted ? "text-muted-foreground" : "text-foreground",
 )}
 >
 {title}
 </p>
 <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
 <MapPin className="h-3 w-3" />
 {sub}
 </p>
 <div className="flex gap-1.5 flex-wrap">
 <span
 className={cn(
 "px-2 py-0.5 text-[10px] rounded-sm",
 muted
 ? "border border-border bg-muted text-muted-foreground"
 : "border border-gold bg-gold text-primary-foreground",
 )}
 >
 React
 </span>
 <span
 className={cn(
 "px-2 py-0.5 text-[10px] rounded-sm",
 muted
 ? "border border-border bg-muted text-muted-foreground"
 : "border border-gold bg-gold text-primary-foreground",
 )}
 >
 Design
 </span>
 </div>
 </div>
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
 <div className="rounded-sm border border-border bg-card p-6 md:p-7">
 <div className="flex items-center gap-2 mb-4 text-gold">{icon}</div>
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
 <div className="rounded-sm border border-border bg-card overflow-hidden flex flex-col">
 <div className="relative bg-muted h-40 flex items-center justify-center">
 {illustration}
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
 10¢
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
// 0 / 24 / 48 / 72. Solid gold bar (no gradient), tick marks below.
const TimelineBar = () => (
 <div className="pt-4">
 <div className="relative h-3 rounded-full bg-muted overflow-hidden">
 <div className="absolute inset-y-0 left-0 right-0 bg-gold" />
 </div>
 <div className="flex justify-between mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
 <span>0h · pin lands</span>
 <span className="hidden sm:inline">24h</span>
 <span className="hidden sm:inline">48h</span>
 <span>72h · expires</span>
 </div>
 </div>
);

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
 <div className="rounded-sm border border-border bg-card p-5">
 <dt className="font-medium text-foreground mb-1.5">{q}</dt>
 <dd className="text-sm text-muted-foreground leading-relaxed">{children}</dd>
 </div>
);

export default Boost;
