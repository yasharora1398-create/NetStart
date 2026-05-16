"use client";
/**
 * Welcome screen. The unauthenticated landing — shown after every
 * sign-out and (via SignedOutRedirect) whenever a session ends.
 * Pure static layout, no animations. Buttons are wired up to the
 * existing sign-up / sign-in routes.
 */
import { Link } from "@/lib/router-compat";
import mothImage from "@/assets/moth.png";
import { assetUrl } from "@/lib/asset-url";

const Welcome = () => {
  return (
    <main className="welcome-stage">
      <header className="welcome-brand">
        <span className="font-display text-2xl tracking-[-0.02em]">Polln8</span>
      </header>

      <h1 className="welcome-title font-display">Welcome</h1>

      <div className="welcome-moth-stage" aria-hidden>
        <img
          src={assetUrl(mothImage)}
          alt=""
          draggable={false}
          className="welcome-moth dark:invert dark:brightness-90 dark:saturate-50 dark:hue-rotate-180"
        />

        <svg
          className="welcome-arrow"
          viewBox="0 0 360 220"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M 30,200 Q 120,140 200,150 T 320,80"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="3 7"
          />
          <path
            d="M 314,72 L 326,82 L 314,92"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p className="welcome-body">
        Polln8 is where founders find cofounders and builders find startups
        to join for equity: vetted profiles, real shipping history, no spam.
      </p>

      <div className="welcome-actions">
        <Link to="/signup" className="welcome-primary">
          Get started
        </Link>
        <p className="welcome-signin">
          Already have an account?{" "}
          <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </main>
  );
};

export default Welcome;
