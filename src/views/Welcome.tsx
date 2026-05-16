"use client";
/**
 * Post-signout welcome screen.
 *
 * Lands here every time a user signs out. Plays a short, deliberate
 * intro: small centered "Polln8" + moth, the moth then traces a wide
 * arc through the upper viewport and grows + tilts as it lands in
 * the upper-right. The brand mark fades out as the moth lifts off,
 * and the welcome copy + sign-in/sign-up CTAs fade in once the moth
 * has arrived.
 *
 * Buttons stay non-interactive until the animation completes so the
 * user can't tab/click through before the screen finishes painting
 * itself. After ANIMATION_MS the gate lifts and both CTAs route to
 * the corresponding auth pages.
 */
import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import mothImage from "@/assets/moth.png";
import { assetUrl } from "@/lib/asset-url";

// Total time before the CTAs become interactive. Matches the keyframe
// durations defined alongside `.welcome-*` classes in src/index.css.
const ANIMATION_MS = 2400;

const Welcome = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), ANIMATION_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="welcome-stage min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Brand mark fades out as the moth lifts off. */}
      <div className="welcome-brand">
        <span className="font-display text-2xl tracking-[-0.02em]">Polln8</span>
      </div>

      {/* The moth itself. Sits in a centered stage so the keyframe
          translate values can be relative to (0, 0) = screen center. */}
      <div className="welcome-moth-stage">
        <img
          src={assetUrl(mothImage)}
          alt=""
          aria-hidden
          draggable={false}
          className="welcome-moth dark:invert dark:brightness-90 dark:saturate-50 dark:hue-rotate-180"
        />
      </div>

      {/* Welcome copy + CTAs, both gated on `ready`. */}
      <section className="welcome-copy" aria-hidden={!ready}>
        <h1 className="font-display text-6xl sm:text-7xl leading-[0.95] tracking-[-0.03em] mb-6">
          Welcome
        </h1>
        <p className="max-w-md text-base sm:text-lg text-foreground leading-relaxed font-medium">
          Polln8 is where founders find cofounders and builders find startups
          to join for equity: vetted profiles, real shipping history, no spam.
        </p>
      </section>

      <div className="welcome-actions" aria-hidden={!ready}>
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
        <p className="welcome-secondary">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="text-primary font-semibold underline-offset-4 hover:underline"
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
