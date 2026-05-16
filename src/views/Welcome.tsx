"use client";
/**
 * Welcome screen — web. Implements the "Polln8 Welcome (Centered)"
 * design from the Claude Design handoff: top wordmark, big serif
 * Welcome headline, moth rotated 49° just below, then "Find your
 * person." headline + description, then the full-width Get started
 * CTA and "Already have an account? Sign in" line.
 *
 * The design uses Spectral (serif) for headlines and Inter (sans)
 * for everything else. Both are loaded via next/font/google so they
 * ship optimized and aren't blocking the initial paint on other
 * pages.
 *
 * On desktop the column stays centered at its 390px design width;
 * on phone widths it fills the viewport so the same proportions
 * hold.
 */
import { Link } from "@/lib/router-compat";
import mothImage from "@/assets/moth.png";
import { assetUrl } from "@/lib/asset-url";

// Spectral (serif) + Inter (sans) are loaded via a stylesheet tag in
// src/app/layout.tsx <head>. The .welcome-* CSS rules in src/index.css
// reference them by family name directly.

const Welcome = () => {
  return (
    <main className="welcome-stage">
      <div className="welcome-frame">
        <div className="welcome-wordmark-row">
          <span className="welcome-wordmark">Polln8</span>
        </div>

        <div className="welcome-spacer" />

        <div className="welcome-center">
          <h1 className="welcome-title">Welcome</h1>

          <div className="welcome-moth-row" aria-hidden>
            <img
              src={assetUrl(mothImage)}
              alt=""
              draggable={false}
              className="welcome-moth dark:invert dark:brightness-90 dark:saturate-50 dark:hue-rotate-180"
            />
          </div>

          <div className="welcome-copy">
            <h2 className="welcome-headline">Find your person.</h2>
            <p className="welcome-body">
              Polln8 is where founders find cofounders and builders find
              startups to join for equity. Vetted profiles, real shipping
              history, no spam.
            </p>
          </div>
        </div>

        <div className="welcome-spacer" />

        <div className="welcome-actions">
          <Link to="/signup" className="welcome-primary">
            Get started
          </Link>
          <p className="welcome-signin">
            Already have an account?{" "}
            <Link to="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Welcome;
