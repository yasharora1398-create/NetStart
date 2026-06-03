"use client";
/**
 * Three-step first-visit overlay shown on Profile. Walks new users
 * through "what is this page", "what to fill in", "what happens
 * after submit" without them having to figure it out cold.
 *
 * Sticky dismissal in localStorage keyed by user id so each account
 * sees the tour exactly once. Skipping the tour also marks it seen,
 * so an impatient user can dismiss without re-popping later.
 *
 * Designed as a centered modal rather than positional coach-marks
 * because Profile's layout shifts between wizard / dashboard / role-
 * switched states, and anchoring coach-marks reliably across all of
 * them would be fragile. The modal copy references the page's parts
 * by name instead.
 */
import { useEffect, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY_PREFIX = "polln8.onboarding.mynet.";

type Step = {
 badge: string;
 title: string;
 body: string;
 cta: string;
};

const STEPS: Step[] = [
 {
 badge: "Step 1 of 3",
 title: "Welcome to Profile.",
 body: "Profile is the profile other members see when matching. The more honest you are about your background, skills, and what you're looking for, the better the matches you get.",
 cta: "Got it",
 },
 {
 badge: "Step 2 of 3",
 title: "Fill in the essentials.",
 body: "Headline, bio, skills, and either a project (founders) or what you're looking to join (partners). Add a LinkedIn URL and a resume so reviewers can verify you. Skip nothing the form marks as required.",
 cta: "Next",
 },
 {
 badge: "Step 3 of 3",
 title: "Submit, then wait under 24h.",
 body: "A real person reviews every profile. You'll get an email when you're in. Once accepted, Match opens immediately and you start seeing real candidates.",
 cta: "Start",
 },
];

type Props = {
 /** Per-user key so each account sees the tour exactly once. */
 userId: string;
};

export const OnboardingTour = ({ userId }: Props) => {
 const storageKey = KEY_PREFIX + userId;
 const [open, setOpen] = useState(false);
 const [step, setStep] = useState(0);

 useEffect(() => {
 try {
 const seen = window.localStorage.getItem(storageKey) === "1";
 if (!seen) setOpen(true);
 } catch {
 // localStorage blocked -- skip the tour rather than show it
 // every page load.
 }
 }, [storageKey]);

 const dismiss = () => {
 setOpen(false);
 try {
 window.localStorage.setItem(storageKey, "1");
 } catch {
 // ignore
 }
 };

 const next = () => {
 if (step + 1 >= STEPS.length) dismiss();
 else setStep((s) => s + 1);
 };

 if (!open) return null;

 const current = STEPS[step];

 return (
 <div
 role="dialog"
 aria-modal="true"
 aria-labelledby="onboarding-title"
 className="fixed inset-0 z-50 flex items-center justify-center px-4"
 >
 <div
 className="absolute inset-0 bg-background "
 onClick={dismiss}
 aria-hidden
 />
 <div className="relative z-10 w-full max-w-md rounded-sm border border-gold bg-card shadow-card overflow-hidden">
 <div className="absolute inset-0 bg-gradient-spotlight pointer-events-none" />
 <div className="relative p-8">
 <button
 type="button"
 onClick={dismiss}
 aria-label="Skip tour"
 className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
 >
 <X className="h-4 w-4" />
 </button>

 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-gold bg-gold mb-6">
 <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white">
 {current.badge}
 </span>
 </div>

 <h2
 id="onboarding-title"
 className="font-display text-3xl leading-[1.05] mb-4"
 >
 {current.title}
 </h2>

 <p className="text-sm text-muted-foreground leading-relaxed mb-8">
 {current.body}
 </p>

 {/* Progress dots so users know how many steps are left
 without us shouting "step 2 of 3" twice on the same
 screen. */}
 <div className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-1.5">
 {STEPS.map((_, i) => (
 <span
 key={i}
 className={
 i === step
 ? "h-1.5 w-6 rounded-full bg-gold"
 : i < step
 ? "h-1.5 w-1.5 rounded-full bg-gold"
 : "h-1.5 w-1.5 rounded-full bg-border"
 }
 />
 ))}
 </div>
 <div className="flex items-center gap-2">
 {step + 1 < STEPS.length && (
 <button
 type="button"
 onClick={dismiss}
 className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
 >
 Skip
 </button>
 )}
 <Button variant="gold" size="sm" onClick={next} className="gap-1.5">
 {current.cta}
 {step + 1 < STEPS.length ? (
 <ArrowRight className="h-3.5 w-3.5" />
 ) : (
 <Check className="h-3.5 w-3.5" />
 )}
 </Button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};
