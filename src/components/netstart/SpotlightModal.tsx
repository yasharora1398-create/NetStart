"use client";
import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Rocket, User, X } from "lucide-react";

import { VerifiedBadge } from "@/components/netstart/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mobile-only, full-screen modal sponsoring Spotlight. Mounted on
// /match (and only there). Blocks all interaction with the page
// behind it until the user taps X (dismiss) or the gold CTA
// (navigate to /spotlight). Dismissal persists via localStorage so
// the modal never returns once the user has actively closed it.
//
// On md+ viewports it renders nothing; desktop users still get the
// non-blocking BoostPopup in the bottom-right corner.

const DISMISS_KEY = "polln8.spotlight-modal.dismissed.v1";

export const SpotlightModal = () => {
 // Default to visible. Hide if either: viewport is desktop (handled
 // via md:hidden on the wrapper, so even if state is true the modal
 // never paints on md+), or the user previously dismissed it.
 const [visible, setVisible] = useState(true);
 // Entrance animation: starts off-screen-bottom and slides up.
 const [animateIn, setAnimateIn] = useState(false);

 useEffect(() => {
 if (typeof window === "undefined") return;
 if (window.localStorage.getItem(DISMISS_KEY) === "1") {
 setVisible(false);
 return;
 }
 // Lock background scroll while the modal is up. Restored on
 // dismiss / unmount.
 const prevOverflow = document.body.style.overflow;
 document.body.style.overflow = "hidden";
 const raf = window.requestAnimationFrame(() => setAnimateIn(true));
 return () => {
 document.body.style.overflow = prevOverflow;
 window.cancelAnimationFrame(raf);
 };
 }, []);

 const dismiss = () => {
 if (typeof window !== "undefined") {
 window.localStorage.setItem(DISMISS_KEY, "1");
 document.body.style.overflow = "";
 }
 setVisible(false);
 };

 if (!visible) return null;

 return (
 <div
 className="md:hidden fixed inset-0 z-[60] bg-background flex flex-col"
 role="dialog"
 aria-modal="true"
 aria-label="Spotlight promo"
 >
 {/* Top bar with X. Padded for the iOS safe area. */}
 <div
 className="flex items-center justify-end px-4 py-3"
 style={{ paddingTop: "max(env(safe-area-inset-top), 0.75rem)" }}
 >
 <button
 type="button"
 onClick={dismiss}
 aria-label="Close"
 className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Body - scrollable in case viewport is short, but the page
 behind is locked. */}
 <div
 className={cn(
 "flex-1 flex flex-col items-center justify-center px-6 pb-10 text-center overflow-y-auto",
 "transition-all duration-500 ease-out",
 animateIn ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
 )}
 >
 <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gold mb-4">
 New
 </p>
 <h1 className="font-display text-5xl leading-[0.95] mb-4">
 Spotlight.
 </h1>
 <p className="text-base text-muted-foreground max-w-sm leading-relaxed mb-7">
 Pin to position #1 of the Match deck for 72 hours AND get
 the permanent blue verified badge. Both perks, one charge.
 </p>

 {/* Single visual element - the boosted+verified card mock.
 Sponsors what the user actually buys. */}
 <div className="w-full max-w-xs mb-8">
 <MiniSpotlightCard />
 </div>

 <div className="flex items-end gap-3 mb-7">
 <span className="font-display text-7xl leading-none">75¢</span>
 <span className="text-xs text-muted-foreground leading-tight pb-2 text-left">
 <span className="font-mono uppercase tracking-widest text-[10px] text-foreground block">
 USD
 </span>
 one-time.
 <br />
 saves 25¢.
 </span>
 </div>

 <Link to="/spotlight" onClick={dismiss} className="w-full max-w-sm">
 <Button variant="gold" size="lg" className="w-full">
 Get Spotlight
 <ArrowRight className="h-4 w-4" />
 </Button>
 </Link>
 <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-3">
 Boost 50¢ &nbsp;·&nbsp; Verified 50¢ &nbsp;·&nbsp;{" "}
 <span className="text-gold">Both 75¢</span>
 </p>
 </div>
 </div>
 );
};

// Compact mock showing what the user's Match card looks like with
// Spotlight applied. Same visual rules as MatchProjectCard:
// border-2 border-primary + "Recommended by Polln8" ribbon + blue
// badge inline with the title.
const MiniSpotlightCard = () => (
 <div className="relative">
 {/* Pinned-#1 eyebrow with bouncing rocket so the user can
 see what the boost half is. */}
 <div className="flex items-center justify-center gap-1.5 mb-2">
 <Rocket
 className="h-3 w-3 text-primary animate-bounce"
 strokeWidth={1.8}
 />
 <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-primary">
 Pinned #1 + Verified
 </span>
 </div>

 <article className="overflow-hidden rounded-xl bg-card shadow-sm border-2 border-primary text-left">
 <div className="bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground">
 Recommended by Polln8
 </div>
 <div className="relative w-full aspect-[4/3] bg-muted flex items-center justify-center">
 <User
 className="h-14 w-14 text-muted-foreground"
 strokeWidth={1.4}
 />
 </div>
 <div className="p-3">
 <p className="font-display text-base leading-tight text-foreground inline-flex items-center gap-1">
 <span>Your card</span>
 <VerifiedBadge size="sm" />
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

export default SpotlightModal;
