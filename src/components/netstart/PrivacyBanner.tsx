"use client";
/**
 * Lightweight privacy notice that floats above the page on first
 * visit. Polln8 uses Plausible analytics (no cookies, no PII tracking),
 * so we don't strictly need a GDPR "consent" banner -- this is an
 * informational nudge that satisfies the spirit of EU/UK rules
 * around transparency without the cookie-walls UX disaster.
 *
 * Dismissal is sticky: once a user clicks "Got it", we set a
 * localStorage flag and never show the banner again on this device.
 *
 * Renders only after mount to avoid hydration mismatches (the banner
 * decision depends on localStorage, which is browser-only). When the
 * user is still hydrating we render null, which is the closest visual
 * match to "banner hidden by the click" and never produces a server-
 * client mismatch.
 */
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Link } from "@/lib/router-compat";

const STORAGE_KEY = "polln8.privacy_banner.dismissed";

export const PrivacyBanner = () => {
 const [mounted, setMounted] = useState(false);
 const [hidden, setHidden] = useState(true);

 useEffect(() => {
 setMounted(true);
 try {
 const seen = window.localStorage.getItem(STORAGE_KEY) === "1";
 setHidden(seen);
 } catch {
 // localStorage blocked (private mode / strict tracker blockers).
 // Default to hiding the banner -- the privacy /privacy page is
 // still linked from the Footer so the info is reachable.
 setHidden(true);
 }
 }, []);

 const dismiss = () => {
 setHidden(true);
 try {
 window.localStorage.setItem(STORAGE_KEY, "1");
 } catch {
 // ignore
 }
 };

 if (!mounted || hidden) return null;

 return (
 <div
 role="dialog"
 aria-label="Privacy notice"
 className="fixed inset-x-3 bottom-3 z-50 md:inset-x-auto md:right-4 md:bottom-4 md:max-w-md"
 >
 <div className="relative rounded-sm border border-gold bg-card shadow-lg p-4 pr-10">
 <p className="text-xs leading-relaxed text-foreground">
 Polln8 uses{" "}
 <a
 href="https://plausible.io/data-policy"
 target="_blank"
 rel="noreferrer"
 className="text-gold hover:underline"
 >
 Plausible
 </a>{" "}
 for privacy-friendly analytics. No cookies, no cross-site
 tracking, no personal data collected. Read more in our{" "}
 <Link to="/privacy" className="text-gold hover:underline">
 privacy policy
 </Link>
 .
 </p>
 <button
 type="button"
 onClick={dismiss}
 aria-label="Dismiss privacy notice"
 className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 </div>
 );
};
