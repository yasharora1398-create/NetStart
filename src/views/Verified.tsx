"use client";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
 ArrowLeft,
 ArrowRight,
 Check,
 Eye,
 Globe,
 Infinity as InfinityIcon,
 Loader2,
 MapPin,
 ShieldCheck,
 User,
} from "lucide-react";
import { toast } from "sonner";

import { AppLayout } from "@/components/netstart/AppLayout";
import { FadeUp } from "@/components/netstart/FadeUp";
import { VerifiedBadge } from "@/components/netstart/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/lib/mynet-storage";
import { getSupabase } from "@/lib/supabase";

// Verified perk: 50c one-time, permanent. Same Stripe Checkout
// flow as boost but POSTs purpose="verified" so the verify-session
// endpoint flips profiles.is_verified rather than inserting a
// boosts row.

const Verified = () => {
 const { user } = useAuth();
 const [submitting, setSubmitting] = useState(false);
 const [alreadyVerified, setAlreadyVerified] = useState(false);

 const role = useMemo(() => {
 const r = user?.user_metadata?.role;
 return r === "founder" ? "founder" : "partner";
 }, [user]);
 const opposite = role === "founder" ? "partner" : "founder";

 // Read current verified state on mount so we can render a "you're
 // verified" branch instead of the checkout CTA for users who
 // already paid.
 useEffect(() => {
 if (!user) return;
 let cancelled = false;
 getProfile(user.id)
 .then((p) => {
 if (!cancelled) setAlreadyVerified(Boolean(p.isVerified));
 })
 .catch(() => {
 /* ignore - we just won't pre-collapse the CTA */
 });
 return () => {
 cancelled = true;
 };
 }, [user]);

 // Verify-session handler. Fires on mount when Stripe redirects
 // back with ?session_id=cs_xxx in the URL. Strips the query so a
 // refresh doesn't loop, and bumps the alreadyVerified flag so the
 // CTA collapses immediately.
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
 toast.error("Sign in to confirm your verification.");
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
 toast.error(data.error ?? "Could not confirm your verification.");
 return;
 }
 if (data.alreadyGranted) {
 toast.success("You're already verified.");
 } else {
 toast.success("Verified. The badge is live on your profile.");
 }
 setAlreadyVerified(true);
 } catch (err) {
 toast.error(
 err instanceof Error
 ? err.message
 : "Could not confirm your verification.",
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
 body: JSON.stringify({ purpose: "verified" }),
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
 <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#1d9bf0] mb-4 flex items-center gap-2">
 <VerifiedBadge size="sm" />
 Verified
 </p>
 <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[0.95] mb-5">
 The blue check.
 <br />
 <em className="text-gradient-gold not-italic">For fifty cents.</em>
 </h1>
 <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed mb-7">
 A one-time 50&cent; upgrade that puts a small blue verified
 badge next to your name everywhere on Polln8, and pins your
 card with the same green outline + &ldquo;Recommended by
 Polln8&rdquo; treatment that curated picks get. Permanent.
 No subscription.
 </p>

 <div className="flex items-end gap-3 mb-7">
 <div className="font-display text-7xl md:text-8xl leading-none transition-transform duration-300 hover:scale-105 origin-bottom-left">
 50¢
 </div>
 <div className="text-xs text-muted-foreground leading-tight pb-2">
 <span className="font-mono uppercase tracking-widest text-[10px] text-foreground block">
 USD
 </span>
 one-time.
 <br />
 forever.
 </div>
 </div>

 {alreadyVerified ? (
 <div className="flex flex-col sm:flex-row sm:items-center gap-3">
 <div className="inline-flex items-center gap-2 rounded-sm border-2 border-[#1d9bf0] bg-card px-4 py-3">
 <VerifiedBadge size="md" />
 <span className="font-medium text-foreground">
 You&apos;re verified.
 </span>
 </div>
 <Link to="/mynet">
 <Button variant="gold" size="lg">
 See it live in MyNet
 <ArrowRight className="h-4 w-4" />
 </Button>
 </Link>
 </div>
 ) : user ? (
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
 Pay 50¢ and get verified
 <ArrowRight className="h-4 w-4" />
 </>
 )}
 </Button>
 ) : (
 <Link to="/signin">
 <Button variant="gold" size="lg" className="w-full sm:w-auto">
 Sign in to verify
 <ArrowRight className="h-4 w-4" />
 </Button>
 </Link>
 )}
 <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-3">
 {user
 ? `Badge appears on your ${role} profile`
 : "Works for founder OR partner accounts"}
 </p>
 {/* Upsell to the combo SKU. Same blue (#1d9bf0) border as
 the verified visual so it reads as a related action. */}
 <Link
 to="/spotlight"
 className="mt-5 inline-flex items-center gap-2 rounded-sm border border-[#1d9bf0] bg-card px-3 py-2 text-xs text-foreground hover:bg-[#1d9bf0] hover:text-white transition-colors"
 >
 <span>
 Want a 72-hour pin too?{" "}
 <span className="text-[#1d9bf0] group-hover:text-white">
 Get both for 75¢
 </span>
 </span>
 <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 </FadeUp>

 {/* Right column: preview of how the verified card looks in
 Match. */}
 <FadeUp delay={150}>
 <VerifiedCardMockup opposite={opposite} />
 </FadeUp>
 </header>

 {/* 3 STAT TILES --------------------------------------------- */}
 <section className="grid md:grid-cols-3 gap-4 mb-16 md:mb-24">
 <FadeUp>
 <StatTile
 icon={<VerifiedBadge size="md" />}
 number="Forever"
 label="Badge term"
 detail="One-time charge. No subscription, no monthly. Badge stays as long as your account exists."
 />
 </FadeUp>
 <FadeUp delay={100}>
 <StatTile
 icon={<MapPin className="h-5 w-5 text-gold" />}
 number="3 spots"
 label="Where the badge shows"
 detail="Public profile, MyNet dashboard, and the chat header next to your name."
 />
 </FadeUp>
 <FadeUp delay={200}>
 <StatTile
 icon={<ShieldCheck className="h-5 w-5 text-gold" />}
 number="Curated"
 label="Match card treatment"
 detail={`Same green outline + "Recommended by Polln8" ribbon as a Polln8-curated pick.`}
 />
 </FadeUp>
 </section>

 {/* WHAT YOU GET --------------------------------------------- */}
 <section className="grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 md:gap-10 mb-16 md:mb-24">
 <FadeUp>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#1d9bf0] mb-3">
 In the box
 </p>
 <h2 className="font-display text-3xl md:text-4xl mb-6 leading-tight">
 What 50¢ actually buys you.
 </h2>
 <ul className="space-y-3">
 <FeatureRow>
 The blue verified badge, rendered next to your name on
 your public profile, the chat header, and your MyNet
 dashboard.
 </FeatureRow>
 <FeatureRow>
 A green outline around your card in the {opposite} Match
 deck so it stands out among everything else.
 </FeatureRow>
 <FeatureRow>
 &ldquo;Recommended by Polln8&rdquo; header strip on your
 card. Same treatment Polln8-curated picks get; tells
 viewers you&apos;re vouched-for.
 </FeatureRow>
 <FeatureRow>
 Permanent. Pay once, badge stays. No subscription, no
 renewal email at month 12.
 </FeatureRow>
 <FeatureRow>
 Stacks with the 72-hour Boost. Verified gives the visual
 treatment; Boost pins you to position #1.
 </FeatureRow>
 </ul>
 </FadeUp>

 <FadeUp delay={150}>
 <BadgePlacementCard />
 </FadeUp>
 </section>

 {/* FAQ ----------------------------------------------------- */}
 <section className="mb-16">
 <FadeUp>
 <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#1d9bf0] mb-3">
 Honest answers
 </p>
 <h2 className="font-display text-3xl md:text-4xl mb-8 leading-tight">
 The questions we keep getting.
 </h2>
 </FadeUp>
 <div className="grid md:grid-cols-2 gap-4 md:gap-6">
 <Faq q="Why only 50 cents?">
 To filter for people who actually want the badge, without
 making cost the reason you can&apos;t have one. Stripe also
 won&apos;t process anything below 50&cent;, so this is the
 floor.
 </Faq>
 <Faq q="Is this the same as Boost?">
 No. Boost pins your card to the top of the deck for 72
 hours. Verified is permanent and changes how your card
 looks but not where it appears. They stack.
 </Faq>
 <Faq q="Does the badge show on mobile?">
 Yes. Same SVG renders inline next to your name on every
 surface that uses your name.
 </Faq>
 <Faq q="Can I lose the badge?">
 Only if you delete your account, or if we find evidence
 you&apos;re impersonating someone. Routine policy
 violations don&apos;t revoke it.
 </Faq>
 <Faq q="Refunds?">
 If something breaks on our end, message us and we&apos;ll
 refund without asking why. We can&apos;t refund
 buyer&apos;s remorse since the badge is instant.
 </Faq>
 <Faq q="Real money?">
 Yes. 50&cent; USD charged to your card via Stripe.
 Currently in test mode while Stripe activation is pending;
 will flip to live charges once we&apos;re ready to take
 real money.
 </Faq>
 </div>
 </section>

 {/* FINAL CTA ----------------------------------------------- */}
 <FadeUp>
 <section className="rounded-sm border-2 border-[#1d9bf0] bg-card p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
 <div className="min-w-0">
 <h2 className="font-display text-3xl md:text-4xl leading-tight mb-2 inline-flex items-center gap-2 flex-wrap">
 <span>The blue check.</span>
 <VerifiedBadge size="lg" />
 </h2>
 <p className="text-sm text-muted-foreground max-w-md">
 Fifty cents, paid once. The badge lives next to your name
 everywhere on Polln8 from the moment payment clears.
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
 </div>
 </AppLayout>
 );
};

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
// Supporting bits.

const VerifiedCardMockup = ({ opposite }: { opposite: string }) => (
 <div className="relative w-full max-w-md mx-auto">
 <div className="flex items-center gap-2 mb-3 ml-1">
 <VerifiedBadge size="sm" />
 <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1d9bf0]">
 How {opposite}s see your card
 </span>
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
 The blue badge sits next to your name on the card itself,
 and on every other surface that shows your name.
 </p>
 </div>
 </article>
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
 <div className="group rounded-sm border border-border bg-card p-6 md:p-7 transition-all duration-300 hover:border-[#1d9bf0] hover:-translate-y-1">
 <div className="flex items-center gap-2 mb-4 transition-transform duration-300 group-hover:scale-110 origin-left">
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

// Side card showing the three concrete surfaces where the badge
// appears. Each row is a tiny mock with the badge inline.
const BadgePlacementCard = () => (
 <div className="rounded-sm border border-border bg-card overflow-hidden">
 <div className="px-5 py-3 border-b border-border">
 <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
 The badge shows on
 </p>
 </div>
 <ul className="divide-y divide-border">
 <PlacementRow icon={<Eye className="h-3.5 w-3.5" />}>
 Your public profile header
 </PlacementRow>
 <PlacementRow icon={<User className="h-3.5 w-3.5" />}>
 The MyNet dashboard name row
 </PlacementRow>
 <PlacementRow icon={<Eye className="h-3.5 w-3.5" />}>
 Your card title in the Match deck
 </PlacementRow>
 <PlacementRow icon={<InfinityIcon className="h-3.5 w-3.5" />}>
 Anywhere else your name shows up
 </PlacementRow>
 </ul>
 </div>
);

const PlacementRow = ({
 icon,
 children,
}: {
 icon: React.ReactNode;
 children: React.ReactNode;
}) => (
 <li className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
 <span className="flex items-center gap-2 text-muted-foreground">
 {icon}
 {children}
 </span>
 <VerifiedBadge size="sm" />
 </li>
);

const FeatureRow = ({ children }: { children: React.ReactNode }) => (
 <li className="flex items-start gap-2.5">
 <Check className="h-4 w-4 text-[#1d9bf0] flex-shrink-0 mt-0.5" />
 <span className="text-sm text-foreground leading-relaxed">{children}</span>
 </li>
);

const Faq = ({ q, children }: { q: string; children: React.ReactNode }) => (
 <div className="rounded-sm border border-border bg-card p-5 transition-colors duration-300 hover:border-[#1d9bf0]">
 <dt className="font-medium text-foreground mb-1.5">{q}</dt>
 <dd className="text-sm text-muted-foreground leading-relaxed">{children}</dd>
 </div>
);

export default Verified;
