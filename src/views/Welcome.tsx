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
import { useForceLightMode } from "@/hooks/useForceLightMode";

// Spectral (serif) + Inter (sans) are loaded via a stylesheet tag in
// src/app/layout.tsx <head>. The .welcome-* CSS rules in src/index.css
// reference them by family name directly.

const Welcome = () => {
  useForceLightMode();
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
            {/* No dark-mode filter — the welcome screen is always
                rendered in the light palette from the design hand-off,
                regardless of the user's site-wide theme. */}
            <img
              src={assetUrl(mothImage)}
              alt=""
              draggable={false}
              className="welcome-moth"
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

        {/* Inline-styled actions so no CSS class can hide the CTA.
            Stays a plain <a> for max compatibility — NextLink does
            client-side nav but a regular anchor still works. */}
        <div
          style={{
            width: "100%",
            maxWidth: 390,
            margin: "0 auto",
            padding: "0 32px 48px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxSizing: "border-box",
          }}
        >
          <a
            href="/signup"
            style={{
              display: "block",
              width: "100%",
              padding: "18px 24px",
              borderRadius: 12,
              background: "#1F5F3E",
              color: "#FAFAF7",
              fontFamily: '"Inter", system-ui, sans-serif',
              fontWeight: 600,
              fontSize: 16,
              letterSpacing: "-0.01em",
              textAlign: "center",
              textDecoration: "none",
              boxSizing: "border-box",
              border: "none",
              cursor: "pointer",
            }}
          >
            Get started
          </a>
          <p
            style={{
              margin: 0,
              textAlign: "center",
              fontFamily: '"Inter", system-ui, sans-serif',
              fontSize: 14,
              color: "#6B6E73",
              fontWeight: 400,
            }}
          >
            Already have an account?{" "}
            <a
              href="/signin"
              style={{
                color: "#1F5F3E",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Welcome;
