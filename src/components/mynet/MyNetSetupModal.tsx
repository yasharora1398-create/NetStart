"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Centered-card setup modal modeled on Linear/Stripe's onboarding.
// 480px wide on desktop, full-width-minus-32px on mobile. Rendered
// over a backdrop-blurred view of the app behind it.
//
// LOCAL-HOST ONLY (gated at the call site).
//
// Behaviour:
//   - Backdrop clicks are no-ops; only the "Skip for now" link
//     dismisses
//   - Skip fades modal + overlay over 300ms then calls onSkip
//   - Successful completion fades into a brief "MyNet is live"
//     card before the parent removes the modal entirely
//   - Stage changes inside the wizard animate as a horizontal
//     slide-in from the right (via the slide-in-right keyframe;
//     each StepShell is keyed on stage so it remounts and animates)

type Progress = {
 // 1-indexed step the user is currently on.
 current: number;
 // Total number of steps in the flow.
 total: number;
};

type Props = {
 open: boolean;
 onSkip: () => void;
 // When true, the modal fades the wizard out and shows a brief
 // success card. Parent should set this on a successful submit
 // and then close the modal a moment later.
 finalCard?: boolean;
 // Where to send the user after the success card (defaults to /mynet).
 finalCtaHref?: string;
 finalCtaLabel?: string;
 // Optional progress indicator. Hidden on the final card.
 progress?: Progress;
 children: ReactNode;
};

export const MyNetSetupModal = ({
 open,
 onSkip,
 finalCard = false,
 finalCtaHref = "/mynet",
 finalCtaLabel = "Open MyNet",
 progress,
 children,
}: Props) => {
 // Local "fading out" state - flipped by handleSkip so we can play
 // a 300ms opacity transition before the parent unmounts the modal.
 const [closing, setClosing] = useState(false);

 // Entrance: mount with opacity 0 then transition to 1 next frame.
 const [mounted, setMounted] = useState(false);
 useEffect(() => {
 if (!open) {
 setMounted(false);
 setClosing(false);
 return;
 }
 const id = window.requestAnimationFrame(() => setMounted(true));
 return () => window.cancelAnimationFrame(id);
 }, [open]);

 // Lock background scroll while the modal is up.
 useEffect(() => {
 if (!open) return;
 const prev = document.body.style.overflow;
 document.body.style.overflow = "hidden";
 return () => {
 document.body.style.overflow = prev;
 };
 }, [open]);

 const handleSkip = () => {
 setClosing(true);
 window.setTimeout(onSkip, 300);
 };

 if (!open) return null;

 const fade = mounted && !closing ? "opacity-100" : "opacity-0";

 return (
 <div
 className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10"
 role="dialog"
 aria-modal="true"
 aria-label="Set up MyNet"
 >
 {/* Backdrop. Translucent dark + backdrop-blur. backdrop-blur-md
 (12px) on mobile for perf; backdrop-blur-xl (24px) on
 desktop. Background overlay uses a darker tint in dark
 mode (#0F1614 @ 60%) than light mode (#0F1410 @ 50%). */}
 <button
 type="button"
 aria-hidden="true"
 tabIndex={-1}
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 }}
 className={cn(
 "absolute inset-0 cursor-default transition-opacity duration-300",
 "bg-[#0F1410]/50 dark:bg-[#0F1614]/60",
 "backdrop-blur-md sm:backdrop-blur-xl",
 fade,
 )}
 />

 {/* Card. Max-w-[480px] desktop, full-width-minus-margin mobile.
 Max-h 80vh so it doesn't bleed off short viewports. Internal
 scroll. */}
 <div
 className={cn(
 "relative w-full max-w-[480px] flex flex-col overflow-hidden",
 "rounded-2xl border bg-card shadow-2xl",
 "bg-[#FFFFFF] border-[#E1E1DC] dark:bg-[#19211D] dark:border-[#2A332E]",
 "max-h-[calc(100dvh-3rem)] sm:max-h-[80vh]",
 "transition-all duration-300 ease-out",
 fade,
 mounted ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.98]",
 )}
 style={{
 boxShadow: "0 20px 60px -10px rgba(15, 20, 16, 0.15)",
 }}
 >
 {finalCard ? (
 <FinalCard
 onContinue={onSkip}
 ctaHref={finalCtaHref}
 ctaLabel={finalCtaLabel}
 />
 ) : (
 <>
 {/* Header: thin progress bar + "Skip for now" link. */}
 <div className="flex items-center justify-between gap-4 px-6 pt-5">
 {progress ? (
 <ProgressBar
 current={progress.current}
 total={progress.total}
 />
 ) : (
 <span aria-hidden className="flex-1" />
 )}
 <button
 type="button"
 onClick={handleSkip}
 className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 min-h-[44px] sm:min-h-0 inline-flex items-center"
 >
 Skip for now
 </button>
 </div>

 {/* Body: scrollable. Children = the wizard. */}
 <div className="flex-1 overflow-y-auto px-6 pb-8 pt-4">
 {children}
 </div>
 </>
 )}
 </div>
 </div>
 );
};

// Thin progress bar at the top of the card. ~3px tall, with a
// filled portion proportional to current/total. Above it, small
// "Step X of N" caption in mono so it reads as system chrome.
const ProgressBar = ({
 current,
 total,
}: {
 current: number;
 total: number;
}) => {
 const pct = Math.max(0, Math.min(1, total > 0 ? current / total : 0));
 return (
 <div className="flex-1 min-w-0">
 <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
 Step {current} of {total}
 </p>
 <div className="relative h-0.5 rounded-full bg-border overflow-hidden">
 <div
 className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-500 ease-out"
 style={{ width: `${pct * 100}%` }}
 />
 </div>
 </div>
 );
};

// Brief celebration card shown right after the user submits their
// profile. Parent flips finalCard=true on submit success, holds it
// for ~1.5s, then onContinue (or auto-dismiss) takes them to
// /mynet.
const FinalCard = ({
 onContinue,
 ctaHref,
 ctaLabel,
}: {
 onContinue: () => void;
 ctaHref: string;
 ctaLabel: string;
}) => (
 <div className="flex flex-col items-center text-center px-6 py-12">
 <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-6">
 <Check className="h-8 w-8" strokeWidth={2.4} />
 </div>
 <h2 className="font-display text-3xl leading-tight mb-2">
 MyNet is live.
 </h2>
 <p className="text-sm text-muted-foreground mb-8 max-w-xs">
 Let&apos;s find your person.
 </p>
 <Link to={ctaHref} onClick={onContinue} className="w-full">
 <Button variant="gold" size="lg" className="w-full min-h-[44px]">
 {ctaLabel}
 <ArrowRight className="h-4 w-4" />
 </Button>
 </Link>
 </div>
);

export default MyNetSetupModal;
