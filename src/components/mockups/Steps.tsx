/**
 * Step mockups - implementations of the Claude Design HTML prototypes
 * for the How it works page (Signup, Credentials, Accepted, Match,
 * Chat). Each component is self-contained: brings its own card
 * background, rust accent, and Inter typography matching the warm
 * earth palette used across the rest of the site.
 */
import builder1 from "@/assets/builder-1.jpg";
import builder2 from "@/assets/builder-2.jpg";
import builder3 from "@/assets/builder-3.jpg";

// Shared design tokens - now theme-aware. Each token maps to a global
// CSS variable so the mockups swap colors automatically when the
// user toggles light/dark via the sidebar. The constant names are
// kept as a stable identifier for accent/ink/etc. across the file.
const FONT = "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif";
const FONT_MONO =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const INK = "hsl(var(--foreground))";                       // text primary
const INK_DIM = "hsl(var(--foreground) / 0.75)";
const INK_MUTED = "hsl(var(--muted-foreground))";
const LINE = "hsl(var(--foreground) / 0.08)";
const LINE_STRONG = "hsl(var(--border))";                   // border default
const CARD_BG = "hsl(var(--card) / 0.85)";
const CARD_BG_OPAQUE = "hsl(var(--card))";
const CARD_BG_TINT = "hsl(var(--accent))";                  // accent tint
const FIELD_BG = "hsl(var(--secondary))";
const RUST = "hsl(var(--primary))";                         // accent
const RUST_GLOW = "hsl(var(--primary) / 0.35)";
const RUST_LIGHT = "hsl(var(--primary))";
const RUST_DEEP = "hsl(var(--primary))";
const MARIGOLD = "hsl(var(--primary))";
const GREEN = "hsl(var(--primary))";                        // semantic green
const GREEN_GLOW = "hsl(var(--primary) / 0.30)";

// Subtle photo tint - neutral now (sepia/orange tint removed when the
// palette flipped from rust to forest green). Just a hair desaturated
// so portraits sit against the page without screaming.
const photoFilter = "saturate(0.95)";

// Frosted-glass base - semi-transparent body picks up the page bg
// through backdrop-filter. Border + bevel use foreground-tinted
// alphas so the surface reads frosted on light AND dark themes
// instead of glowing bright-white in dark mode.
const baseCard = {
  fontFamily: FONT,
  color: INK,
  background: CARD_BG,
  backdropFilter: "blur(24px) saturate(150%)",
  WebkitBackdropFilter: "blur(24px) saturate(150%)",
  border: "1px solid hsl(var(--foreground) / 0.10)",
  borderRadius: 14,
  boxShadow: [
    "0 1px 2px rgba(0, 0, 0, 0.10)",
    "0 4px 12px rgba(0, 0, 0, 0.12)",
    "0 16px 40px -8px rgba(0, 0, 0, 0.18)",
    "inset 0 1px 0 hsl(var(--foreground) / 0.06)",
    "inset 0 -1px 0 hsl(var(--foreground) / 0.04)",
  ].join(", "),
  position: "relative" as const,
};

// ============= 1. SIGNUP =============================================

export const StepSignup = () => (
  <div style={{ ...baseCard, width: 380, padding: "28px 28px 22px" }}>
    <div
      style={{
        fontFamily: FONT_MONO,
        fontSize: 10.5,
        fontWeight: 500,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: RUST,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 18,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: MARIGOLD,
          boxShadow: `0 0 8px rgba(31, 95, 62,0.55)`,
          display: "inline-block",
        }}
      />
      <span>CREATE ACCOUNT</span>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Field>
        <input
          readOnly
          value="marcus@vey.io"
          style={inputStyle}
          aria-label="Email"
        />
      </Field>
      <Field>
        <input
          readOnly
          type="password"
          value="correcthorsebatterystaple"
          style={{
            ...inputStyle,
            letterSpacing: "0.18em",
            fontFamily: FONT_MONO,
          }}
          aria-label="Password"
        />
      </Field>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        marginTop: 14,
      }}
    >
      <Choice selected={false} name="Builder" sub="Ship every day" />
      <Choice selected={true} name="Founder" sub="Set the direction" />
    </div>

    <CTA label="Continue" />
  </div>
);

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  appearance: "none",
  WebkitAppearance: "none",
  background: "transparent",
  border: 0,
  outline: 0,
  color: INK,
  font: "inherit",
  fontSize: 14,
  letterSpacing: "0.005em",
  caretColor: RUST,
};

const Field = ({ children }: { children: React.ReactNode }) => (
  <label
    style={{
      position: "relative",
      display: "flex",
      alignItems: "center",
      height: 44,
      padding: "0 14px",
      background: FIELD_BG,
      border: `1.5px solid #9DA1A8`,
      borderRadius: 8,
    }}
  >
    {children}
  </label>
);

const Choice = ({
  selected,
  name,
  sub,
}: {
  selected: boolean;
  name: string;
  sub: string;
}) => (
  <div
    style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      padding: "14px 14px 13px",
      borderRadius: 10,
      background: selected
        ? "linear-gradient(180deg, rgba(31, 95, 62,0.10), rgba(31, 95, 62,0.04))"
        : FIELD_BG,
      border: selected
        ? `1.5px solid ${RUST}`
        : `1px solid ${LINE_STRONG}`,
      boxShadow: selected
        ? `0 0 0 3px rgba(31, 95, 62,0.15), 0 4px 12px rgba(31, 95, 62,0.10)`
        : undefined,
      opacity: selected ? 1 : 0.78,
    }}
  >
    <span
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: selected ? `1.5px solid ${RUST}` : `1px solid hsl(var(--border))`,
        background: selected ? RUST : CARD_BG_OPAQUE,
        boxShadow: selected
          ? "0 0 0 3px rgba(31, 95, 62,0.18)"
          : undefined,
      }}
    />
    <span
      style={{
        fontSize: 13.5,
        fontWeight: 600,
        color: selected ? INK : INK_DIM,
        letterSpacing: "-0.005em",
      }}
    >
      {name}
    </span>
    <span
      style={{
        fontSize: 11,
        color: selected ? INK_DIM : INK_MUTED,
        letterSpacing: "0.005em",
      }}
    >
      {sub}
    </span>
  </div>
);

const CTA = ({ label }: { label: string }) => (
  <button
    type="button"
    style={{
      marginTop: 18,
      width: "100%",
      height: 44,
      border: 0,
      borderRadius: 8,
      background: RUST,
      color: "#fff",
      font: "inherit",
      fontSize: 14,
      fontWeight: 500,
      letterSpacing: "0.005em",
      cursor: "default",
      boxShadow:
        "0 1px 0 rgba(255,255,255,0.25) inset, 0 -6px 14px rgba(0,0,0,0.10) inset, 0 4px 14px rgba(31, 95, 62,0.30)",
    }}
  >
    {label}
  </button>
);

// ============= 2. CREDENTIALS ========================================

export const StepCredentials = () => (
  <div style={{ ...baseCard, width: 400, padding: "24px 22px 20px" }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <CredRow
        icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
          </svg>
        }
        primary="linkedin.com/in/marcus-vey"
      />
      <CredRow
        icon={
          <svg
            width="13"
            height="14"
            viewBox="0 0 14 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8.5.75H2.25A1.5 1.5 0 0 0 .75 2.25v11.5a1.5 1.5 0 0 0 1.5 1.5h9.5a1.5 1.5 0 0 0 1.5-1.5V5.25Z" />
            <path d="M8.5.75v3a1.5 1.5 0 0 0 1.5 1.5h3.25" />
            <path d="M3.75 8.5h6.5M3.75 11.25h4.5" />
          </svg>
        }
        primary="marcus_vey_resume.pdf"
        sub="218 KB"
      />
    </div>
    <div style={{ marginTop: 16 }}>
      <CTA label="Submit for review" />
    </div>
  </div>
);

const CredRow = ({
  icon,
  primary,
  sub,
}: {
  icon: React.ReactNode;
  primary: string;
  sub?: string;
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "32px 1fr auto",
      alignItems: "center",
      gap: 12,
      height: 56,
      padding: "0 14px",
      background: FIELD_BG,
      border: `1px solid ${LINE_STRONG}`,
      borderRadius: 8,
    }}
  >
    <span
      style={{
        width: 32,
        height: 32,
        display: "grid",
        placeItems: "center",
        borderRadius: 7,
        background: "rgba(31, 95, 62,0.10)",
        border: `1px solid rgba(31, 95, 62,0.25)`,
        color: RUST,
      }}
    >
      {icon}
    </span>
    <div
      style={{
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: INK,
          letterSpacing: "-0.005em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {primary}
      </span>
      {sub && (
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 9.5,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: INK_MUTED,
          }}
        >
          {sub}
        </span>
      )}
    </div>
    <span
      aria-label="Verified"
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "rgba(31, 95, 62,0.14)",
        border: `1px solid rgba(31, 95, 62,0.45)`,
        color: GREEN,
        boxShadow: `0 0 0 3px rgba(31, 95, 62,0.06)`,
        flexShrink: 0,
      }}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="2.5,6.5 5,9 9.5,3.5" />
      </svg>
    </span>
  </div>
);

// ============= 3. ACCEPTED ===========================================

export const StepAccepted = () => (
  <div
    style={{
      ...baseCard,
      width: 360,
      padding: "44px 28px 30px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <div
      style={{
        position: "relative",
        width: 140,
        height: 140,
        display: "grid",
        placeItems: "center",
        marginBottom: 28,
      }}
    >
      {/* outer soft glow - marigold */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: -20,
          background:
            "radial-gradient(circle, rgba(253, 232, 219,0.55) 0%, rgba(253, 232, 219,0.18) 35%, rgba(0,0,0,0) 70%)",
          filter: "blur(2px)",
          zIndex: 0,
        }}
      />
      {/* inner halo */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          width: 96,
          height: 96,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(31, 95, 62,0.45) 0%, rgba(31, 95, 62,0) 70%)",
          zIndex: 0,
        }}
      />
      {/* badge - rust gradient */}
      <div
        style={{
          position: "relative",
          width: 76,
          height: 76,
          borderRadius: "50%",
          background: `linear-gradient(180deg, ${RUST_LIGHT} 0%, ${RUST} 60%, ${RUST_DEEP} 100%)`,
          display: "grid",
          placeItems: "center",
          boxShadow: `0 1px 0 rgba(255,255,255,0.4) inset, 0 -10px 20px rgba(0,0,0,0.18) inset, 0 0 0 1px rgba(255,255,255,0.18) inset, 0 0 0 6px rgba(31, 95, 62,0.12), 0 0 0 12px rgba(31, 95, 62,0.06), 0 12px 30px ${RUST_GLOW}, 0 2px 4px rgba(21, 23, 26,0.18)`,
          zIndex: 1,
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.18))" }}
        >
          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>
    </div>

    <div
      style={{
        fontFamily: FONT_MONO,
        fontSize: 10.5,
        fontWeight: 500,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: RUST,
        marginBottom: 10,
      }}
    >
      ACCEPTED
    </div>
    <div
      style={{
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: "-0.012em",
        color: INK,
        marginBottom: 6,
      }}
    >
      Marcus Vey
    </div>
    <div
      style={{
        fontSize: 11.5,
        color: INK_MUTED,
        letterSpacing: "0.005em",
      }}
    >
      <span>Verified</span>
      <span
        style={{
          display: "inline-block",
          width: 2,
          height: 2,
          borderRadius: "50%",
          background: INK_MUTED,
          verticalAlign: "middle",
          margin: "0 6px 2px",
        }}
      />
      <span>8m ago</span>
    </div>
  </div>
);

// ============= 4. MATCH ==============================================

// Two optional knobs:
//   • `portraits` - override the defaults (builder-1/2/3) with a
//     specific trio of image URLs. Used when you want different
//     people on the marketing surface.
//   • `anonymous` - render the deck with silhouette fallbacks instead
//     of portraits. Used on the waitlist hero so the marketing page
//     doesn't promise specific real people.
type StepMatchProps = {
  portraits?: [string, string, string];
  anonymous?: boolean;
};

export const StepMatch = ({
  portraits,
  anonymous,
}: StepMatchProps = {}) => {
  const photos: [string | undefined, string | undefined, string | undefined] =
    anonymous
      ? [undefined, undefined, undefined]
      : (portraits ?? [builder1, builder2, builder3]);
  const [front, back1, back2] = photos;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
        paddingTop: 18,
        paddingBottom: 18,
      }}
    >
      {/* Deck - 3 cards, the back two offset */}
      <div
        style={{
          position: "relative",
          width: 240,
          height: 380,
          margin: "0 110px",
        }}
      >
        <DeckCard
          position="back-2"
          portrait={back2}
          match="87% MATCH"
          name="Devon Ortiz"
          sub="Design lead · ex-Figma"
          location="Austin, TX"
          tags={["DESIGN SYSTEMS", "B2B"]}
        />
        <DeckCard
          position="back-1"
          portrait={back1}
          match="91% MATCH"
          name="Aisha Bello"
          sub="Founding PM · ex-Notion"
          location="New York, NY"
          tags={["PRODUCT", "FINTECH"]}
        />
        <DeckCard
          position="front"
          portrait={front}
          match="94% MATCH"
          name="Riley Pham"
          sub="Senior eng · ex-Stripe"
          location="San Francisco, CA"
          availability="Open to chat"
          tags={["PAYMENTS", "DISTRIBUTED", "RUST"]}
        />
      </div>

      {/* Action row */}
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <ActionBtn variant="pass" />
        <ActionBtn variant="connect" />
        <ActionBtn variant="save" />
      </div>
    </div>
  );
};

const DeckCard = ({
  position,
  portrait,
  match,
  name,
  sub,
  location,
  availability,
  tags,
}: {
  position: "front" | "back-1" | "back-2";
  // Optional - when omitted, the card renders an anonymous silhouette
  // instead of a real portrait. Used by the waitlist hero so the
  // marketing page doesn't promise specific people.
  portrait?: string;
  match: string;
  name: string;
  sub: string;
  location: string;
  availability?: string;
  tags: string[];
}) => {
  const back2 = position === "back-2";
  const back1 = position === "back-1";
  const front = position === "front";

  return (
    <div
      aria-hidden={!front}
      style={{
        position: "absolute",
        inset: 0,
        background: CARD_BG,
        backdropFilter: "blur(24px) saturate(150%)",
        WebkitBackdropFilter: "blur(24px) saturate(150%)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        borderRadius: 18,
        boxShadow: front
          ? [
              "0 1px 2px rgba(21, 23, 26, 0.05)",
              "0 6px 16px rgba(21, 23, 26, 0.08)",
              "0 24px 56px -8px rgba(21, 23, 26, 0.16)",
              "inset 0 1px 0 rgba(255, 255, 255, 0.9)",
              "inset 0 -1px 0 rgba(199, 184, 158, 0.3)",
              "inset 0 0 0 0.5px rgba(255, 255, 255, 0.55)",
            ].join(", ")
          : back2
            ? [
                "0 1px 2px rgba(21, 23, 26, 0.04)",
                "0 4px 12px rgba(21, 23, 26, 0.06)",
                "-8px 16px 32px -8px rgba(21, 23, 26, 0.10)",
                "inset 0 1px 0 rgba(255, 255, 255, 0.7)",
                "inset 0 0 0 0.5px rgba(255, 255, 255, 0.4)",
              ].join(", ")
            : [
                "0 1px 2px rgba(21, 23, 26, 0.04)",
                "0 4px 12px rgba(21, 23, 26, 0.06)",
                "8px 16px 32px -8px rgba(21, 23, 26, 0.10)",
                "inset 0 1px 0 rgba(255, 255, 255, 0.7)",
                "inset 0 0 0 0.5px rgba(255, 255, 255, 0.4)",
              ].join(", "),
        transform: back2
          ? "translate(-110px, 18px) scale(0.78)"
          : back1
            ? "translate(110px, 18px) scale(0.78)"
            : undefined,
        transformOrigin: "center",
        filter: back2
          ? "brightness(0.92) saturate(0.85)"
          : back1
            ? "brightness(0.96) saturate(0.9)"
            : undefined,
        opacity: back2 ? 0.92 : back1 ? 0.95 : 1,
        zIndex: front ? 2 : 0,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        color: INK,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 12,
          overflow: "hidden",
          background: CARD_BG_TINT,
          flexShrink: 0,
        }}
      >
        {portrait ? (
          <img
            src={portrait}
            alt={name}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: photoFilter,
            }}
          />
        ) : (
          // Anonymous silhouette fallback - neutral grey field with a
          // generic avatar shape. Same dimensions as the photo, so the
          // gradient overlay + name pill below keep working unchanged.
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, ${LINE_STRONG} 0%, rgba(199, 184, 158, 0.25) 100%)`,
              display: "grid",
              placeItems: "center",
            }}
          >
            <svg
              width="64%"
              height="64%"
              viewBox="0 0 64 64"
              fill="none"
              aria-hidden
              style={{ opacity: 0.32 }}
            >
              {/* Head */}
              <circle cx="32" cy="22" r="11" fill={INK} />
              {/* Shoulders */}
              <path
                d="M8 60 C 8 44 18 36 32 36 C 46 36 56 44 56 60 Z"
                fill={INK}
              />
            </svg>
          </div>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(21, 23, 26,0) 55%, rgba(21, 23, 26,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 12,
            bottom: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 9px 5px 8px",
            background: "rgba(21, 23, 26,0.78)",
            border: `1px solid rgba(244,237,217,0.3)`,
            borderRadius: 999,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            fontFamily: FONT_MONO,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#FFFFFF",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: MARIGOLD,
              boxShadow: `0 0 8px rgba(253, 232, 219,0.55)`,
            }}
          />
          {match}
        </span>
      </div>
      <div
        style={{
          padding: "14px 6px 0",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 8,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.012em",
            color: INK,
          }}
        >
          {name}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: INK_MUTED,
            letterSpacing: "0.005em",
          }}
        >
          {sub}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: INK_DIM,
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, opacity: 0.7 }}
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{location}</span>
          {availability && (
            <>
              <span style={{ color: "rgba(21, 23, 26,0.22)", margin: "0 4px" }}>
                ·
              </span>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, opacity: 0.7 }}
              >
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
              </svg>
              <span>{availability}</span>
            </>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            marginTop: 2,
          }}
        >
          {tags.map((t) => (
            <span
              key={t}
              style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "3px 7px",
                borderRadius: 4,
                background: FIELD_BG,
                border: `1px solid ${LINE_STRONG}`,
                color: INK_DIM,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const ActionBtn = ({ variant }: { variant: "pass" | "connect" | "save" }) => {
  const isConnect = variant === "connect";
  const size = isConnect ? 56 : 44;
  return (
    <button
      type="button"
      aria-label={variant}
      style={{
        appearance: "none",
        border: isConnect ? 0 : `1px solid ${LINE_STRONG}`,
        cursor: "default",
        width: size,
        height: size,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: isConnect
          ? `linear-gradient(180deg, ${RUST_LIGHT} 0%, ${RUST} 100%)`
          : CARD_BG_OPAQUE,
        color: isConnect ? "#fff" : INK_DIM,
        boxShadow: isConnect
          ? `0 1px 0 rgba(255,255,255,0.3) inset, 0 -8px 14px rgba(0,0,0,0.10) inset, 0 6px 18px ${RUST_GLOW}, 0 2px 4px rgba(21, 23, 26,0.18)`
          : "0 1px 4px rgba(21, 23, 26,0.06)",
      }}
    >
      {variant === "pass" && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      )}
      {variant === "connect" && (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {variant === "save" && (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  );
};

// ============= 5. CHAT ===============================================

export const StepChat = () => (
  <div
    style={{
      ...baseCard,
      width: 380,
      height: 460,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      borderRadius: 16,
    }}
  >
    {/* Header */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderBottom: `1px solid ${LINE_STRONG}`,
        flexShrink: 0,
        background: CARD_BG_TINT,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: `linear-gradient(180deg, rgba(31, 95, 62,0.22), rgba(31, 95, 62,0.10))`,
          border: `1px solid rgba(31, 95, 62,0.35)`,
          boxShadow: `0 0 0 3px rgba(31, 95, 62,0.08)`,
          color: RUST_DEEP,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.04em",
          fontFamily: FONT,
        }}
      >
        RP
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: INK,
            letterSpacing: "-0.005em",
            fontFamily: FONT,
          }}
        >
          Riley Pham
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: FONT_MONO,
            fontSize: 9.5,
            fontWeight: 500,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: GREEN,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: GREEN,
              boxShadow: `0 0 0 2px rgba(31, 95, 62,0.18), 0 0 8px ${GREEN_GLOW}`,
            }}
          />
          ONLINE
        </div>
      </div>
    </div>

    {/* Messages */}
    <div
      style={{
        flex: 1,
        minHeight: 0,
        padding: "20px 16px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        overflowY: "auto",
        fontFamily: FONT,
        background: CARD_BG,
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: 9.5,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: INK_MUTED,
          textAlign: "center",
          margin: "4px 0 8px",
        }}
      >
        TODAY · 2:14 PM
      </div>
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <div
          style={{
            maxWidth: "78%",
            padding: "10px 14px",
            borderRadius: 16,
            borderBottomLeftRadius: 6,
            fontSize: 13.5,
            lineHeight: 1.4,
            letterSpacing: "0.005em",
            background: FIELD_BG,
            border: `1px solid ${LINE_STRONG}`,
            color: INK,
          }}
        >
          Hey, saw your credentials and I think they match well with what Im
          doing. Are you willing to meet up on call?
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            maxWidth: "78%",
            padding: "10px 14px",
            borderRadius: 16,
            borderBottomRightRadius: 6,
            fontSize: 13.5,
            lineHeight: 1.4,
            letterSpacing: "0.005em",
            background: `linear-gradient(180deg, ${RUST_LIGHT} 0%, ${RUST} 100%)`,
            border: `1px solid ${RUST_DEEP}`,
            color: "#FFFFFF",
            boxShadow: `0 4px 12px -4px ${RUST_GLOW}`,
          }}
        >
          Yeah sure, that sounds great. When are you free?
        </div>
      </div>
    </div>

    {/* Composer */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 12px 12px 16px",
        borderTop: `1px solid ${LINE_STRONG}`,
        background: CARD_BG_TINT,
        flexShrink: 0,
      }}
    >
      <input
        readOnly
        placeholder="Type a message..."
        style={{
          flex: 1,
          minWidth: 0,
          appearance: "none",
          background: "transparent",
          border: 0,
          outline: 0,
          color: INK,
          font: "inherit",
          fontFamily: FONT,
          fontSize: 13.5,
          height: 36,
          padding: 0,
          caretColor: RUST,
        }}
      />
      <button
        type="button"
        aria-label="Send"
        style={{
          appearance: "none",
          border: 0,
          cursor: "default",
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          background: `linear-gradient(180deg, ${RUST_LIGHT} 0%, ${RUST} 100%)`,
          color: "#fff",
          boxShadow: `0 1px 0 rgba(255,255,255,0.25) inset, 0 -6px 12px rgba(0,0,0,0.10) inset, 0 4px 12px ${RUST_GLOW}, 0 2px 4px rgba(21, 23, 26,0.18)`,
          flexShrink: 0,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 2 11 13" />
          <path d="M22 2l-7 20-4-9-9-4 20-7Z" />
        </svg>
      </button>
    </div>
  </div>
);
