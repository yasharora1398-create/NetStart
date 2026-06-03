"use client";
import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Rocket, User, X } from "lucide-react";

import { VerifiedBadge } from "@/components/netstart/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mobile-only popup sponsoring Spotlight. Mounted on /match (and
// only there). Translucent dark backdrop so the user can SEE the
// Match deck behind the modal - they know what page they're on,
// they just can't interact with it. The modal card itself takes
// almost the full viewport (small inset around the edges) and
// stays put until the user taps X or the gold CTA. Backdrop taps
// do nothing on purpose.
//
// Dismissal persists via localStorage. Renders nothing on md+;
// desktop /match gets the small non-blocking BoostPopup instead.

// Key version bumped to v4 - the user kept missing the v3 modal
// because they dismissed it on a previous visit and the flag stuck.
// Bumping forces a fresh render.
const DISMISS_KEY = "polln8.spotlight-modal.dismissed.v4";

export const SpotlightModal = () => {
 const [visible, setVisible] = useState(true);
 const [animateIn, setAnimateIn] = useState(false);

 useEffect(() => {
 if (typeof window === "undefined") return;
 if (window.localStorage.getItem(DISMISS_KEY) === "1") {
 setVisible(false);
 return;
 }
 // Lock background scroll while the modal is up so the deck
 // behind can't drift around under the user's thumb.
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
 // md:hidden gates the whole thing to mobile. fixed inset-0
 // covers the viewport; the translucent dark layer is the
 // backdrop, the inner div is the actual modal card.
 <div
 className="md:hidden fixed inset-0 z-[60] flex items-center justify-center px-3 py-3"
 role="dialog"
 aria-modal="true"
 aria-label="Spotlight promo"
 // pointer-events on the wrapper so the modal card catches taps,
 // but the translucent backdrop separately blocks taps on the
 // page behind without dismissing the modal.
 >
 {/* Translucent backdrop. User explicitly asked to see the
 Match deck behind it, so this is intentionally see-through.
 onClick does nothing - the only exits are the X button and
 the CTA. */}
 <button
 type="button"
 aria-hidden="true"
 tabIndex={-1}
 className="absolute inset-0 bg-foreground/50 cursor-default"
 style={{ pointerEvents: "auto" }}
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 }}
 />

 {/* Modal card. Almost-full-screen island floating above the
 backdrop. Solid bg-card so the content is fully legible
 against whatever deck is behind. */}
 <div
 className={cn(
 "relative w-full h-full max-w-md rounded-2xl border-2 border-gold bg-card shadow-2xl overflow-hidden flex flex-col",
 "transition-all duration-500 ease-out",
 animateIn
 ? "translate-y-0 opacity-100"
 : "translate-y-8 opacity-0",
 )}
 style={{
 // Tighten vertical so the card sits inside iOS safe area
 // without clipping its corners under notch / home bar.
 marginTop: "max(env(safe-area-inset-top), 0.75rem)",
 marginBottom: "max(env(safe-area-inset-bottom), 0.75rem)",
 }}
 >
 {/* X button. Top-right, larger touch target. */}
 <div className="absolute top-3 right-3 z-10">
 <button
 type="button"
 onClick={dismiss}
 aria-label="Close"
 className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* Scrollable body so short viewports still reach the CTA. */}
 <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center overflow-y-auto">
 <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gold mb-4">
 New
 </p>
 <h1 className="font-display text-5xl leading-[0.95] mb-4">
 Spotlight.
 </h1>
 <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-7">
 Pin to position #1 of the Match deck for 72 hours AND get
 the permanent blue verified badge. Both perks, one charge.
 </p>

 <div className="w-full max-w-xs mb-7">
 <MiniSpotlightCard />
 </div>

 <div className="flex items-end gap-3 mb-6">
 <span className="font-display text-6xl leading-none">75¢</span>
 <span className="text-xs text-muted-foreground leading-tight pb-1.5 text-left">
 <span className="font-mono uppercase tracking-widest text-[10px] text-foreground block">
 USD
 </span>
 one-time.
 <br />
 saves 25¢.
 </span>
 </div>

 <Link to="/app/spotlight" onClick={dismiss} className="w-full max-w-sm">
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
 </div>
 );
};

// Compact Match-card mock with all three Spotlight treatments
// applied: border-2 border-primary + "Recommended by Polln8" ribbon
// + blue badge inline + Pinned #1 eyebrow.
const MiniSpotlightCard = () => (
 <div className="relative">
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
