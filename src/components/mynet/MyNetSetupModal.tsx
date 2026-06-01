"use client";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

// Stripe-style onboarding modal that wraps MyNetWizard. Almost-full-
// screen card centered on a translucent + backdrop-blurred backdrop,
// so the user sees the rest of the app (sidebar + footer + page
// content) behind the modal, blurred. Small X top-right is the
// only escape hatch; the parent component decides what shows behind
// the modal when the user skips.
//
// LOCAL-HOST ONLY for now (gated at the call site, not here). The
// existing full-page wizard stays the prod experience until the
// user signs off on this one.

type Props = {
 open: boolean;
 onSkip: () => void;
 children: ReactNode;
};

export const MyNetSetupModal = ({ open, onSkip, children }: Props) => {
 // Lock background scroll while the modal is up so the blurred
 // page behind doesn't drift under the user's pointer.
 useEffect(() => {
 if (!open) return;
 const prev = document.body.style.overflow;
 document.body.style.overflow = "hidden";
 return () => {
 document.body.style.overflow = prev;
 };
 }, [open]);

 if (!open) return null;

 return (
 <div
 className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
 role="dialog"
 aria-modal="true"
 aria-label="Set up MyNet"
 >
 {/* Backdrop. backdrop-blur defocuses the page behind, the
 translucent fill darkens it slightly so the modal card
 reads as the focus point. Clicks pass through to a no-op
 button so the user can't accidentally dismiss by tapping
 the backdrop - only X closes it. */}
 <button
 type="button"
 aria-hidden="true"
 tabIndex={-1}
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 }}
 className="absolute inset-0 bg-foreground/30 backdrop-blur-md cursor-default"
 />

 {/* Modal card. Inset from each edge so the blurred page
 strip remains visible around it. Internal scroll for long
 content (the credentials + details steps are tall on
 mobile). */}
 <div
 className={cn(
 "relative w-full max-w-5xl rounded-2xl border-2 border-gold bg-card shadow-2xl overflow-hidden flex flex-col",
 "h-[calc(100dvh-2rem)] md:h-[calc(100dvh-4rem)]",
 )}
 >
 {/* Skip control. Sticky top-right inside the card so it
 stays reachable when the user scrolls the wizard. */}
 <button
 type="button"
 onClick={onSkip}
 aria-label="Skip setup for now"
 title="Skip"
 className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors"
 >
 <X className="h-4 w-4" />
 </button>

 {/* Scrollable body - the wizard renders inside here. */}
 <div className="flex-1 overflow-y-auto px-4 md:px-10 py-10 md:py-14">
 {children}
 </div>
 </div>
 </div>
 );
};

export default MyNetSetupModal;
