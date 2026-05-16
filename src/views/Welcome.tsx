"use client";
/**
 * Post-signout welcome screen. Plays the same animation every time
 * a user signs out (web). The choreography matches the storyboard:
 *
 *   t=0     small moth in center, "Polln8" mark at top
 *   t=0.2s  moth lifts off and begins a full counter-clockwise orbit
 *           around the center, growing as it goes
 *   t=2.4s  moth lands in the upper-right, large and tilted ~30deg
 *   t=1.5s  "Welcome" title fades in beneath it
 *   t=2.0s  dashed arrow draws itself from lower-left up to the moth
 *   t=2.4s  body copy fades in
 *   t=2.7s  "Get started" CTA rises in + begins a soft glow pulse
 *   t=2.9s  "Already have an account? Sign in" fades in
 *   t=3.0s  buttons become interactive
 *
 * The Polln8 brand mark is NOT faded out — it stays pinned at the top
 * for the whole sequence (matches the final-frame mockup).
 */
import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import mothImage from "@/assets/moth.png";
import { assetUrl } from "@/lib/asset-url";

// Total time before CTAs become interactive. Matches the latest
// animation keyframe in src/index.css (.welcome-* classes).
const ANIMATION_MS = 3000;

const Welcome = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), ANIMATION_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="welcome-stage">
      {/* Top brand mark — stays visible through the whole animation. */}
      <header className="welcome-brand">
        <span className="font-display text-2xl tracking-[-0.02em]">Polln8</span>
      </header>

      {/* Huge Welcome title. Fades in after the moth lifts off. The
          moth animates over the top-right portion of this text so the
          final composition matches the storyboard. */}
      <h1 className="welcome-title font-display">Welcome</h1>

      {/* Moth. Absolutely positioned against the hero area so its
          keyframe transforms are relative to the visual center. */}
      <div className="welcome-moth-stage" aria-hidden>
        <img
          src={assetUrl(mothImage)}
          alt=""
          draggable={false}
          className="welcome-moth dark:invert dark:brightness-90 dark:saturate-50 dark:hue-rotate-180"
        />

        {/* Dashed curved arrow pointing toward the moth's resting spot.
            Stroke-dashoffset animates from the path length down to 0
            so the line "draws" itself once the moth is settling. */}
        <svg
          className="welcome-arrow"
          viewBox="0 0 360 220"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            className="welcome-arrow-path"
            d="M 30,200 Q 120,140 200,150 T 320,80"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="3 7"
          />
          <path
            className="welcome-arrow-head"
            d="M 314,72 L 326,82 L 314,92"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Body copy. Bold so it reads with the same weight as the
          screenshot. */}
      <p className="welcome-body">
        Polln8 is where founders find cofounders and builders find startups
        to join for equity: vetted profiles, real shipping history, no spam.
      </p>

      {/* CTAs. Get started has its own rise-in + pulse animation;
          Sign in fades in just behind it. */}
      <div className="welcome-actions">
        <Link
          to="/signup"
          className="welcome-primary"
          tabIndex={ready ? 0 : -1}
          aria-disabled={!ready}
          onClick={(e) => {
            if (!ready) e.preventDefault();
          }}
        >
          Get started
        </Link>
        <p className="welcome-signin">
          Already have an account?{" "}
          <Link
            to="/signin"
            tabIndex={ready ? 0 : -1}
            aria-disabled={!ready}
            onClick={(e) => {
              if (!ready) e.preventDefault();
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Welcome;
