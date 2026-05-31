"use client";
import { Link } from "@/lib/router-compat";
import {
 ArrowRight,
 Rocket,
 User,
} from "lucide-react";

import { AppLayout } from "@/components/netstart/AppLayout";
import { FadeUp } from "@/components/netstart/FadeUp";
import { VerifiedBadge } from "@/components/netstart/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Central listing of every paid feature on Polln8. Three product
// cards in a responsive grid; each card carries a tiny live mock of
// what the Match card looks like with that perk applied, so the
// visual difference is immediately legible without having to read
// the body copy.

type Variant = "boost" | "verified" | "spotlight";

const Perks = () => {
 return (
 // hideBottomNav: /perks is a catalog/marketing page accessed
 // from the hamburger, not part of the core app loop, so the
 // mobile bottom tab bar would just be noise here.
 <AppLayout hideBottomNav>
 <div className="container max-w-6xl py-8 md:py-12">
 {/* HERO --------------------------------------------------- */}
 <FadeUp>
 <header className="mb-12 md:mb-16 max-w-3xl">
 <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gold mb-4">
 Paid features
 </p>
 <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[0.95] mb-5">
 Tiny prices.
 <br />
 <em className="text-gradient-gold not-italic">
 Outsized signal.
 </em>
 </h1>
 <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
 Three optional upgrades that change how your card shows up
 in Match. Each one is a one-time charge, no subscriptions,
 no surprise renewals. Pick one or all three.
 </p>
 </header>
 </FadeUp>

 {/* THREE PRODUCT CARDS ------------------------------------ */}
 <div className="grid md:grid-cols-3 gap-5 md:gap-6">
 <FadeUp>
 <ProductCard
 variant="boost"
 name="Boost"
 price="50¢"
 priceNote="USD · 72 hours"
 href="/boost"
 description="Pin your card to position #1 of the opposite-role Match deck for 72 hours. Every viewer in the window sees you first. Then the pin expires automatically."
 highlight={["#1 position", "72-hour window", "Green outline on card"]}
 hideMockOnMobile
 />
 </FadeUp>
 <FadeUp delay={120}>
 <ProductCard
 variant="verified"
 name="Verified"
 price="50¢"
 priceNote="USD · permanent"
 href="/verified"
 description="A blue check next to your name everywhere on Polln8, plus your Match card gets the green outline and 'Recommended by Polln8' header strip. One charge, badge forever."
 highlight={[
 "Blue badge everywhere",
 "Outline + ribbon on card",
 "Permanent, no renewal",
 ]}
 />
 </FadeUp>
 <FadeUp delay={240}>
 <ProductCard
 variant="spotlight"
 name="Spotlight"
 price="75¢"
 priceNote="USD · both at once"
 href="/spotlight"
 description="The combo SKU. Boost + Verified bundled into one charge for 25% off versus buying each separately. 72-hour pin AND the permanent blue badge, paid for once."
 highlight={[
 "Boost + Verified, bundled",
 "Saves 25¢ vs separate",
 "Pin + badge from one charge",
 ]}
 best
 />
 </FadeUp>
 </div>

 {/* SMALL PRINT BELOW THE GRID ----------------------------- */}
 <FadeUp>
 <p className="mt-10 text-xs text-muted-foreground max-w-2xl">
 All prices in USD, charged once via Stripe. Card test mode is
 active while Stripe activation is pending; real cards work
 once we flip to live keys.
 </p>
 </FadeUp>
 </div>
 </AppLayout>
 );
};

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
// Product card. Mini Match-card mock on top, name + price below,
// description, three highlight bullets, "Get X" gold button.

type ProductCardProps = {
 variant: Variant;
 name: string;
 price: string;
 priceNote: string;
 href: string;
 description: string;
 highlight: string[];
 // "Best value" ribbon on the Spotlight card.
 best?: boolean;
 // Mobile-only: hide the mini Match-card mock. Used to keep
 // /perks at 2 images max on phones - the Spotlight card is the
 // most visually informative so its mock stays on every viewport;
 // Verified shows because the badge is its whole point; Boost's
 // mock (green outline only) is the least distinct, so we hide
 // its mock on mobile.
 hideMockOnMobile?: boolean;
};

const ProductCard = ({
 variant,
 name,
 price,
 priceNote,
 href,
 description,
 highlight,
 best = false,
 hideMockOnMobile = false,
}: ProductCardProps) => (
 <div className="group relative h-full rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-gold hover:-translate-y-1 flex flex-col">
 {/* Best value ribbon (Spotlight only). Sits at the top-right
 of the card. */}
 {best ? (
 <div className="absolute top-4 right-4 z-10 rounded-full bg-primary px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-primary-foreground">
 Best value
 </div>
 ) : null}

 {/* Mini Match-card mock area. Muted background; the actual
 mini-card sits centered inside. Optionally hidden on mobile
 via the `hideMockOnMobile` prop (Boost card only). */}
 <div
 className={cn(
 "bg-muted p-6 flex items-center justify-center min-h-[200px]",
 hideMockOnMobile && "hidden md:flex",
 )}
 >
 <MiniMatchCard variant={variant} />
 </div>

 {/* Body */}
 <div className="p-6 flex-1 flex flex-col">
 <h2 className="font-display text-3xl md:text-4xl mb-1 leading-tight">
 {name}
 </h2>
 <div className="flex items-baseline gap-2 mb-3">
 <span className="font-display text-2xl text-gold">{price}</span>
 <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
 {priceNote}
 </span>
 </div>
 <p className="text-sm text-muted-foreground leading-relaxed mb-4">
 {description}
 </p>
 <ul className="space-y-1.5 mb-5">
 {highlight.map((h, i) => (
 <li
 key={i}
 className="text-xs text-foreground flex items-start gap-2"
 >
 <span className="text-gold mt-0.5">▸</span>
 <span>{h}</span>
 </li>
 ))}
 </ul>
 {/* "Get X" CTA pinned to the bottom of the flex column so
 every card's button lines up regardless of body length. */}
 <div className="mt-auto">
 <Link to={href} className="block">
 <Button variant="gold" size="lg" className="w-full">
 Get {name}
 <ArrowRight className="h-4 w-4" />
 </Button>
 </Link>
 </div>
 </div>
 </div>
);

// """""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""""
// Mini Match-card mock - same visual vocabulary as MatchProjectCard
// but scaled down. Each variant flips the treatments on / off so
// the user can see at a glance what the perk does to their card.

const MiniMatchCard = ({ variant }: { variant: Variant }) => {
 const ribbon = variant === "verified" || variant === "spotlight";
 const badge = variant === "verified" || variant === "spotlight";
 const pinned = variant === "spotlight";

 return (
 <div className="w-full max-w-[220px] relative">
 {/* "Pinned #1" eyebrow only on the spotlight variant. */}
 {pinned ? (
 <div className="flex items-center gap-1 mb-2 ml-1">
 <Rocket
 className="h-3 w-3 text-primary animate-bounce"
 strokeWidth={1.8}
 />
 <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary">
 Pinned #1
 </span>
 </div>
 ) : null}

 <article
 className={cn(
 "overflow-hidden rounded-xl bg-card shadow-sm",
 // Every paid perk gets the heavier primary border so the
 // card feels different from baseline.
 "border-2 border-primary",
 )}
 >
 {ribbon ? (
 <div className="bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground">
 Recommended by Polln8
 </div>
 ) : null}

 <div className="relative w-full aspect-[4/3] bg-muted flex items-center justify-center">
 <User
 className="h-12 w-12 text-muted-foreground"
 strokeWidth={1.4}
 />
 </div>

 <div className="p-3">
 <p className="font-display text-sm leading-tight text-foreground inline-flex items-center gap-1">
 <span>Your card</span>
 {badge ? <VerifiedBadge size="sm" /> : null}
 </p>
 <div className="mt-1.5 flex gap-1">
 <span className="px-1.5 py-0.5 text-[8px] rounded-sm border border-gold bg-gold text-primary-foreground">
 Full-time
 </span>
 <span className="px-1.5 py-0.5 text-[8px] rounded-sm border border-gold bg-gold text-primary-foreground">
 Remote
 </span>
 </div>
 </div>
 </article>
 </div>
 );
};

export default Perks;
