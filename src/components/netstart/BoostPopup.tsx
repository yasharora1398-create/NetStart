"use client";
import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Rocket, X } from "lucide-react";

// Floating bottom-right card promoting the /boost feature. Sticky
// across page navigations within Match / Home; dismissing it sets a
// session-storage flag so it doesn't reappear on every nav within
// the same session.
//
// Local-host only for now (gated by NODE_ENV !== "production") so it
// doesn't ship to polln8.com until the Stripe wiring is live.

const DISMISS_KEY = "polln8.boost-popup.dismissed";

export const BoostPopup = () => {
 const [visible, setVisible] = useState(false);

 useEffect(() => {
 if (process.env.NODE_ENV === "production") return;
 if (typeof window === "undefined") return;
 if (window.sessionStorage.getItem(DISMISS_KEY) === "1") return;
 // Small delay so it doesn't pop up the instant a page loads and
 // distract from the page hero.
 const t = window.setTimeout(() => setVisible(true), 1200);
 return () => window.clearTimeout(t);
 }, []);

 const dismiss = () => {
 if (typeof window !== "undefined") {
 window.sessionStorage.setItem(DISMISS_KEY, "1");
 }
 setVisible(false);
 };

 if (!visible) return null;

 return (
 <div
 className="fixed bottom-4 right-4 z-50 w-[320px] rounded-sm border-2 border-gold bg-card shadow-xl"
 role="dialog"
 aria-label="Boost your card"
 >
 {/* Header strip with the eyebrow + close. Same gold-on-card
 treatment as the rest of the marketing surfaces. */}
 <div className="flex items-start justify-between gap-3 px-4 pt-4">
 <div className="flex items-center gap-2">
 <Rocket className="h-4 w-4 text-gold" />
 <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
 New
 </p>
 </div>
 <button
 type="button"
 onClick={dismiss}
 aria-label="Dismiss"
 className="text-muted-foreground hover:text-foreground transition-colors -mt-1 -mr-1 p-1"
 >
 <X className="h-3.5 w-3.5" />
 </button>
 </div>

 <div className="px-4 pb-4">
 <h3 className="font-display text-xl leading-tight mt-1">
 Skip the queue. <span className="text-gold">10¢.</span>
 </h3>
 <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
 Pin your card to the top of the opposite-role Match deck for
 72 hours. One-time, no subscription.
 </p>
 <Link
 to="/boost"
 onClick={dismiss}
 className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
 >
 See how it works
 <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 </div>
 </div>
 );
};

export default BoostPopup;
