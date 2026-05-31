"use client";
import { useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
 ArrowLeft,
 ArrowRight,
 Check,
 Clock,
 Loader2,
 Rocket,
 Sparkles,
 TrendingUp,
 Users,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/netstart/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

// Boost is a 10c, 72-hour pin to the top of the opposite-role Match
// deck. Founders get pinned to the deck partners see, partners get
// pinned to the deck founders see. This page is the marketing /
// payment surface; the actual Stripe wiring lands in a follow-up.

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
 // No Stripe yet - just acknowledge the click so the flow can be
 // demoed end-to-end. The real handler will POST to
 // /api/stripe/checkout and redirect to the hosted page.
 await new Promise((r) => setTimeout(r, 600));
 setSubmitting(false);
 toast.info(
 "Stripe isn't wired up yet. The boost will activate once payment is connected.",
 );
 };

 return (
 <AppLayout>
 <div className="container max-w-3xl py-6 md:py-10">
 <Link
 to="/match"
 className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6"
 >
 <ArrowLeft className="h-3.5 w-3.5" />
 Back to Match
 </Link>

 {/* HERO ------------------------------------------------------ */}
 <header className="mb-10">
 <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gold mb-3 flex items-center gap-2">
 <Rocket className="h-3.5 w-3.5" />
 Boost
 </p>
 <h1 className="font-display text-4xl md:text-5xl leading-[1] mb-3">
 Skip the queue.<br />
 <em className="text-gradient-gold not-italic">For ten cents.</em>
 </h1>
 <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
 Pin your card to the top of the {opposite} Match deck for{" "}
 <strong className="text-foreground">{DURATION_HOURS} hours</strong>.
 Every {opposite} who opens Match in that window sees you first. No
 algorithm guesswork, no waiting for the right moment.
 </p>
 </header>

 {/* PRICE CARD ----------------------------------------------- */}
 <section className="rounded-sm border-2 border-gold bg-card p-6 md:p-8 mb-8">
 <div className="flex items-start justify-between gap-4 flex-wrap">
 <div className="min-w-0">
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
 Today only
 </p>
 <div className="flex items-baseline gap-2">
 <span className="font-display text-6xl md:text-7xl leading-none">
 10¢
 </span>
 <span className="text-sm text-muted-foreground">
 one-time
 </span>
 </div>
 <p className="text-xs text-muted-foreground mt-2 max-w-sm">
 Charged once. Boost runs immediately and expires{" "}
 {DURATION_HOURS} hours later.
 </p>
 </div>
 <div className="flex flex-col items-end gap-2">
 <div className="flex items-center gap-1.5 text-sm">
 <Clock className="h-4 w-4 text-gold" />
 <span className="font-medium">{DURATION_HOURS} hours of priority</span>
 </div>
 <div className="flex items-center gap-1.5 text-sm">
 <Users className="h-4 w-4 text-gold" />
 <span className="font-medium">Every {opposite} sees you first</span>
 </div>
 <div className="flex items-center gap-1.5 text-sm">
 <TrendingUp className="h-4 w-4 text-gold" />
 <span className="font-medium">No algorithm guesswork</span>
 </div>
 </div>
 </div>

 <div className="border-t border-border mt-6 pt-6 flex items-center justify-between gap-3 flex-wrap">
 {user ? (
 <>
 <p className="text-xs text-muted-foreground">
 Signed in as <span className="text-foreground">{user.email}</span>. Boost will
 activate on the {role} side of your account.
 </p>
 <Button
 variant="gold"
 size="lg"
 onClick={handlePay}
 disabled={submitting}
 >
 {submitting ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 Sending…
 </>
 ) : (
 <>
 Pay {(PRICE_CENTS / 100).toFixed(2).replace(/^0/, "")}¢ &amp; boost now
 <ArrowRight className="h-4 w-4" />
 </>
 )}
 </Button>
 </>
 ) : (
 <>
 <p className="text-xs text-muted-foreground">
 Sign in to boost. The boost activates on whichever role
 (founder or partner) you&apos;re using.
 </p>
 <Link to="/signin">
 <Button variant="gold" size="lg">
 Sign in to continue
 <ArrowRight className="h-4 w-4" />
 </Button>
 </Link>
 </>
 )}
 </div>
 </section>

 {/* WHAT YOU GET --------------------------------------------- */}
 <section className="mb-8">
 <h2 className="font-display text-2xl mb-4">What you get</h2>
 <ul className="space-y-3">
 <FeatureRow>
 Your card pinned to the top of the {opposite} Match deck for
 the full {DURATION_HOURS} hours.
 </FeatureRow>
 <FeatureRow>
 Every {opposite} who opens Match in that window sees you in
 the first card position, regardless of similarity score.
 </FeatureRow>
 <FeatureRow>
 Works on top of normal ranking, so your boost stacks with
 already-good matches rather than replacing them.
 </FeatureRow>
 <FeatureRow>
 One boost per account at a time. No queueing, no overlap.
 </FeatureRow>
 <FeatureRow>
 Automatic expiry. No subscription, no cancel-anytime, no
 dark-pattern renewal.
 </FeatureRow>
 </ul>
 </section>

 {/* FAQ ------------------------------------------------------- */}
 <section className="rounded-sm border border-border bg-card p-6">
 <h2 className="font-display text-xl mb-4 flex items-center gap-2">
 <Sparkles className="h-4 w-4 text-gold" />
 Honest answers
 </h2>
 <dl className="space-y-4 text-sm">
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
 <Faq q="Refunds?">
 If something breaks on our end, message us at support and
 we&apos;ll refund without asking why.
 </Faq>
 </dl>
 </section>
 </div>
 </AppLayout>
 );
};

const FeatureRow = ({ children }: { children: React.ReactNode }) => (
 <li className="flex items-start gap-2.5">
 <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
 <span className="text-sm text-foreground leading-relaxed">{children}</span>
 </li>
);

const Faq = ({ q, children }: { q: string; children: React.ReactNode }) => (
 <div>
 <dt className="font-medium text-foreground mb-1">{q}</dt>
 <dd className="text-muted-foreground leading-relaxed">{children}</dd>
 </div>
);

export default Boost;
