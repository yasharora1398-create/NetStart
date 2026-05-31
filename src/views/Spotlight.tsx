"use client";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
 ArrowLeft,
 ArrowRight,
 Check,
 Globe,
 Loader2,
 Rocket,
 User,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/netstart/AppLayout";
import { FadeUp } from "@/components/netstart/FadeUp";
import { VerifiedBadge } from "@/components/netstart/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase";

// Spotlight = the combo SKU. Pays 75c, gets BOTH the 72-hour boost
// pin AND the permanent verified badge. Cheaper than buying each
// perk alone (50c + 50c = $1.00; spotlight = 75c, 25% off).
//
// Same Stripe Checkout flow as boost/verified but POSTs
// purpose="spotlight" so the verify-session endpoint runs both
// grants in one shot.

const BOOST_HOURS = 72;

const Spotlight = () => {
 const { user } = useAuth();
 const [submitting, setSubmitting] = useState(false);

 const role = useMemo(() => {
 const r = user?.user_metadata?.role;
 return r === "founder" ? "founder" : "partner";
 }, [user]);
 const opposite = role === "founder" ? "partner" : "founder";

 // Verify-session handler. Fires on mount when Stripe redirects
 // back with ?session_id=cs_xxx in the URL. Strips the query so
 // refresh doesn't loop.
 useEffect(() => {
 if (typeof window === "undefined") return;
 const params = new URLSearchParams(window.location.search);
 const sessionId = params.get("session_id");
 if (!sessionId) return;
 window.history.replaceState({}, "", window.location.pathname);
 void (async () => {
 try {
 const { data: sess } = await getSupabase().auth.getSession();
 const token = sess.session?.access_token;
 if (!token) {
 toast.error("Sign in to confirm your purchase.");
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
 error?: string;
 };
 if (!res.ok || !data.ok) {
 toast.error(data.error ?? "Could not confirm your purchase.");
 return;
 }
 if (data.alreadyGranted) {
 toast.success("Spotlight already active.");
 } else {
 toast.success(
 `Spotlight on. You're verified + pinned for ${BOOST_HOURS} hours.`,
 );
 }
 // Bust the Match deck cache so the pin shows immediately on
 // the next /match visit.
 try {
 window.localStorage.removeItem("polln8.match.projects");
 } catch {
 /* ignore */
 }
 } catch (err) {
 toast.error(
 err instanceof Error
 ? err.message
 : "Could not confirm your purchase.",
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
 body: JSON.stringify({ purpose: "spotlight" }),
 });
 const data = (await res.json()) as { url?: string; error?: string };
 if (!res.ok || !data.url) {
 throw new Error(data.error ?? "Could not start checkout.");
 }
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
 <header className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-10 md:gap-14 items-center mb-16 md:mb-24">
 <FadeUp className="min-w-0">
 <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gold mb-4">
 Spotlight
 </p>
 <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[0.95] mb-5">
 Everything,
 <br />
 <em className="text-gradient-gold not-italic">at once.</em>
 </h1>
 <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mb-7">
 Pin to position #1 of the {opposite} deck for {BOOST_HOURS}{" "}
 hours <strong className="text-foreground">and</strong> get
 the permanent blue check next to your name. Both perks, one
 charge, 25% off versus buying them separately.
 </p>

 <div className="flex items-end gap-3 mb-2">
 <div className="font-display text-7xl md:text-8xl leading-none transition-transform duration-300 hover:scale-105 origin-bottom-left">
 75¢
 </div>
 <div className="text-xs text-muted-foreground leading-tight pb-2">
 <span className="font-mono uppercase tracking-widest text-[10px] text-foreground block">
 USD
 </span>
 one-time.
 <br />
 saves 25¢.
 </div>
 </div>
 <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-7">
 Boost alone 50¢ &nbsp;·&nbsp; Verified alone 50¢ &nbsp;·&nbsp;
 Both together <span className="text-gold">75¢</span>
 </p>

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
 Pay 75¢ and turn on Spotlight
 <ArrowRight className="h-4 w-4" />
 </>
 )}
 </Button>
 ) : (
 <Link to="/signin">
 <Button variant="gold" size="lg" className="w-full sm:w-auto">
 Sign in to get Spotlight
 <ArrowRight className="h-4 w-4" />
 </Button>
 </Link>
 )}
 <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-3">
 {user
 ? `Pins your ${role} card; activates the badge`
 : "Works for founder OR partner accounts"}
 </p>
 </FadeUp>

 {/* Right column: combined preview - the Match card mocked
 with BOTH treatments stacked. */}
 <FadeUp delay={150}>
 <SpotlightCardMockup opposite={opposite} />
 </FadeUp>
 </header>

 {/* WHAT YOU GET (split: boost row + verified row) ---------- */}
 <section className="grid md:grid-cols-2 gap-4 md:gap-6 mb-16 md:mb-24">
 <FadeUp>
 <PerkCard
 icon={<Rocket className="h-5 w-5 text-gold animate-bounce" strokeWidth={1.8} />}
 eyebrow="The Boost half"
 title={`${BOOST_HOURS} hours at the top of the deck`}
 body={`Your card pins to position #1 of the ${opposite} Match deck for the full ${BOOST_HOURS}-hour window. Then the pin expires automatically and you slide back to your normal rank.`}
 bullets={[
 `Position #1 for ${BOOST_HOURS} hours`,
 `Every ${opposite} who opens Match sees you first`,
 "Auto-expires, no subscription",
 ]}
 />
 </FadeUp>
 <FadeUp delay={120}>
 <PerkCard
 icon={<VerifiedBadge size="md" />}
 eyebrow="The Verified half"
 title="The blue check, permanently"
 body={`A small blue checkmark renders next to your name everywhere on Polln8 (public profile, chat header, MyNet dashboard). Your card also gets the green outline + "Recommended by Polln8" header strip in Match.`}
 bullets={[
 "Blue badge next to your name, everywhere",
 'Green outline + "Recommended by Polln8" ribbon on your card',
 "Permanent. One charge, never expires",
 ]}
 />
 </FadeUp>
 </section>

 {/* HOW IT STACKS ------------------------------------------- */}
 <section className="mb-16 md:mb-24">
 <FadeUp>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
 How they stack
 </p>
 <h2 className="font-display text-3xl md:text-4xl mb-8 leading-tight max-w-3xl">
 Verified makes you worth looking at. Boost makes sure
 they look.
 </h2>
 </FadeUp>
 <div className="grid md:grid-cols-3 gap-4 md:gap-6">
 <FadeUp>
 <StatTile
 number="#1"
 label={`In the ${opposite} deck`}
 detail="The pin puts you at the top. The first card every viewer sees."
 />
 </FadeUp>
 <FadeUp delay={100}>
 <StatTile
 number="Both"
 label="Outline + ribbon"
 detail='The card border thickens to primary green and the "Recommended by Polln8" strip sits at the top.'
 />
 </FadeUp>
 <FadeUp delay={200}>
 <StatTile
 number="Forever"
 label="The badge stays"
 detail="The boost expires in 72 hours, but the verified blue check is permanent. One purchase, lifelong badge."
 />
 </FadeUp>
 </div>
 </section>

 {/* FAQ ----------------------------------------------------- */}
 <section className="mb-16">
 <FadeUp>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold mb-3">
 Honest answers
 </p>
 <h2 className="font-display text-3xl md:text-4xl mb-8 leading-tight">
 What the bundle actually buys.
 </h2>
 </FadeUp>
 <div className="grid md:grid-cols-2 gap-4 md:gap-6">
 <Faq q="Is this just Boost + Verified bundled?">
 Exactly that. Same two perks, paid for in one Stripe
 charge, 25% cheaper than buying them separately (75¢
 instead of $1.00).
 </Faq>
 <Faq q="When does the boost kick in?">
 The moment payment clears. The {BOOST_HOURS}-hour timer
 starts at that instant and counts down. The verified
 badge appears at the same moment and never goes away.
 </Faq>
 <Faq q="What happens after 72 hours?">
 The pin expires and your card returns to its normal rank.
 The verified badge + green outline + ribbon stay forever.
 You can buy another boost (or another spotlight) later if
 you want another pin.
 </Faq>
 <Faq q="Can I buy Spotlight if I'm already verified?">
 Yes. The verified half just no-ops (you stay verified)
 and the boost half kicks in normally. Effectively you
 paid 75¢ for a boost when you could have paid 50¢. We
 don&apos;t refund the difference, so just buy Boost
 alone if you&apos;re already verified.
 </Faq>
 <Faq q="What if I'm already boosted?">
 Same answer in reverse. The boost half tries to insert
 another 72h pin row, the verified half flips the badge
 on. You may end up with overlapping boost windows.
 Worth it only if you weren&apos;t verified yet.
 </Faq>
 <Faq q="Refunds?">
 If something breaks on our end, message us and we&apos;ll
 refund. We can&apos;t refund buyer&apos;s remorse since
 both perks activate instantly.
 </Faq>
 </div>
 </section>

 {/* FINAL CTA ----------------------------------------------- */}
 <FadeUp>
 <section className="rounded-sm border-2 border-gold bg-card p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
 <div className="min-w-0">
 <h2 className="font-display text-3xl md:text-4xl leading-tight mb-2 inline-flex items-center gap-2 flex-wrap">
 <span>The full Spotlight.</span>
 <Rocket className="h-7 w-7 text-gold" />
 <VerifiedBadge size="lg" />
 </h2>
 <p className="text-sm text-muted-foreground max-w-md">
 Seventy-five cents. Top of the deck for {BOOST_HOURS}{" "}
 hours, blue check forever. The next {opposite} who opens
 Match sees you first.
 </p>
 </div>
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

 {/* Cross-links to the standalone products */}
 <FadeUp>
 <div className="mt-10 grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
 <Link
 to="/boost"
 className="rounded-sm border border-border bg-card p-4 hover:border-gold transition-colors"
 >
 <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
 Just want the pin?
 </span>
 <p className="text-foreground mt-1">
 Get Boost on its own → 50¢ for 72 hours
 </p>
 </Link>
 <Link
 to="/verified"
 className="rounded-sm border border-border bg-card p-4 hover:border-[#1d9bf0] transition-colors"
 >
 <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
 Just want the badge?
 </span>
 <p className="text-foreground mt-1">
 Get Verified on its own → 50¢ forever
 </p>
 </Link>
 </div>
 </FadeUp>
 </div>
 </AppLayout>
 );
};

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
// Supporting bits.

const SpotlightCardMockup = ({ opposite }: { opposite: string }) => (
 <div className="relative w-full max-w-md mx-auto">
 {/* Double-stacked eyebrow showing both treatments. */}
 <div className="flex items-center gap-3 mb-3 ml-1 flex-wrap">
 <div className="flex items-center gap-1.5">
 <Rocket className="h-3.5 w-3.5 text-primary animate-bounce" />
 <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
 Pinned #1
 </span>
 </div>
 <span className="text-muted-foreground">+</span>
 <div className="flex items-center gap-1.5">
 <VerifiedBadge size="sm" />
 <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1d9bf0]">
 Verified forever
 </span>
 </div>
 </div>

 <div className="inline-flex items-center gap-2 self-start font-display text-2xl md:text-3xl font-bold tracking-tight text-primary mb-3 break-all">
 <Globe className="h-5 w-5 flex-shrink-0" />
 yourstartup.com
 </div>

 <article className="overflow-hidden rounded-2xl bg-card shadow-sm border-2 border-primary">
 <div className="bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
 Recommended by Polln8
 </div>

 <div className="relative w-full aspect-[4/3] bg-muted">
 <div className="absolute inset-0 flex items-center justify-center">
 <User
 className="h-32 w-32 text-muted-foreground"
 strokeWidth={1.4}
 />
 </div>
 </div>

 <div className="p-5">
 <h3 className="mb-3 font-display text-2xl leading-tight text-foreground inline-flex items-center gap-1.5">
 <span>Your name</span>
 <VerifiedBadge size="md" />
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
 Green outline, &ldquo;Recommended by Polln8&rdquo; ribbon,
 the blue check inline with your name, and the #1 deck
 position. All four at once.
 </p>
 </div>
 </article>

 <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-3 text-center">
 What every {opposite} sees first, for the next {BOOST_HOURS} hours.
 </p>
 </div>
);

const PerkCard = ({
 icon,
 eyebrow,
 title,
 body,
 bullets,
}: {
 icon: React.ReactNode;
 eyebrow: string;
 title: string;
 body: string;
 bullets: string[];
}) => (
 <div className="group rounded-sm border border-border bg-card p-6 md:p-8 transition-all duration-300 hover:border-gold hover:-translate-y-1 h-full flex flex-col">
 <div className="flex items-center gap-2 mb-3">
 {icon}
 <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
 {eyebrow}
 </p>
 </div>
 <h3 className="font-display text-2xl md:text-3xl mb-3 leading-tight">
 {title}
 </h3>
 <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
 {body}
 </p>
 <ul className="space-y-2">
 {bullets.map((b, i) => (
 <li key={i} className="flex items-start gap-2 text-sm text-foreground">
 <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
 <span>{b}</span>
 </li>
 ))}
 </ul>
 </div>
);

const StatTile = ({
 number,
 label,
 detail,
}: {
 number: string;
 label: string;
 detail: string;
}) => (
 <div className="group rounded-sm border border-border bg-card p-6 md:p-7 transition-all duration-300 hover:border-gold hover:-translate-y-1">
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

const Faq = ({ q, children }: { q: string; children: React.ReactNode }) => (
 <div className="rounded-sm border border-border bg-card p-5 transition-colors duration-300 hover:border-gold">
 <dt className="font-medium text-foreground mb-1.5">{q}</dt>
 <dd className="text-sm text-muted-foreground leading-relaxed">{children}</dd>
 </div>
);

export default Spotlight;
