/**
 * Hummingbird hawk-moth empty states (web port). Same seven scene
 * variants and copy as `mobile/components/MothEmptyState.tsx`, but
 * rendered with regular SVG + an HTML img instead of react-native-svg.
 *
 *   blank    — huge moth, tiny stem with bud (haven't started)
 *   caught   — wide horizon, branch curving across, far-perched moth
 *   saves    — oversized bookmark fills the frame, moth on its corner
 *   threads  — top-down envelope on a desk, moth rising out of it
 *   apps     — paper airplane angled up, moth riding the top wing
 *   platform — almost pure negative space, one tiny moth drifting
 *   filters  — magnifying glass dominates, moth visible inside lens
 *
 * Colors come from the existing CSS variables (gold + accent-bg) so
 * dark mode works automatically. The moth PNG is a dark silhouette
 * by default; in dark mode we drop a CSS filter on it (invert +
 * desaturate) so it reads against the dark card.
 */
import mothImage from "@/assets/moth.png";

export type MothVariant =
  | "blank"
  | "caught"
  | "saves"
  | "threads"
  | "apps"
  | "platform"
  | "filters";

type MothPos = {
  size: number;
  x: number;
  y: number;
  rot: number;
};

const SCENE_W = 240;
const SCENE_H = 168;

type SceneProps = {
  accent: string;
  accentBg: string;
  muted: string;
};

type Variant = {
  title: string;
  sub: string;
  moth: MothPos;
  Scene: (p: SceneProps) => JSX.Element;
};

// ─── per-variant defaults ──────────────────────────────────────────

const VARIANTS: Record<MothVariant, Variant> = {
  blank: {
    title: "No projects yet.",
    sub: "Hawk-moths need flowers to hover over. Set up a project to plant the first.",
    moth: { size: 120, x: 6, y: 2, rot: 70 },
    Scene: (p) => (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <path
          stroke={p.accent}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M 156 168 Q 158 152 154 138"
        />
        <path
          stroke={p.accent}
          strokeWidth={1.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M 154 152 q 8 -2 12 4"
        />
        <ellipse
          cx={154}
          cy={132}
          rx={6}
          ry={9}
          stroke={p.accent}
          strokeWidth={1.4}
          fill={p.accentBg}
        />
        <path
          stroke={p.accent}
          strokeWidth={1}
          fill="none"
          strokeDasharray="1 4"
          strokeLinecap="round"
          d="M 96 70 Q 124 100 152 130"
        />
      </svg>
    ),
  },

  caught: {
    title: "You're caught up.",
    sub: "Every project in your range has been visited. Wings up. New ones land here as founders post them.",
    moth: { size: 28, x: 184, y: 106, rot: 185 },
    Scene: (p) => (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <circle
          cx={58}
          cy={60}
          r={22}
          stroke={p.accent}
          strokeWidth={1.4}
          fill={p.accentBg}
        />
        <line
          x1={0}
          y1={116}
          x2={240}
          y2={116}
          stroke={p.muted}
          strokeWidth={1}
          strokeDasharray="2 4"
        />
        <path
          stroke={p.accent}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M -4 130 Q 90 112 196 124 L 224 130"
        />
        <path
          stroke={p.accent}
          strokeWidth={1.4}
          fill={p.accentBg}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M 198 124 q 14 -3 22 4 q -10 7 -22 -4 Z"
        />
      </svg>
    ),
  },

  saves: {
    title: "No saves yet.",
    sub: "Tap the star on a project and it stays here, easy to find when you're ready to revisit.",
    moth: { size: 56, x: 68, y: -10, rot: 300 },
    Scene: (p) => (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <path
          stroke={p.accent}
          strokeWidth={1.6}
          fill={p.accentBg}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M 92 6 H 168 V 162 L 130 138 L 92 162 Z"
        />
        <line
          x1={106}
          y1={60}
          x2={154}
          y2={60}
          stroke={p.accent}
          strokeWidth={1}
          strokeDasharray="2 3"
          opacity={0.6}
        />
        <line
          x1={106}
          y1={78}
          x2={142}
          y2={78}
          stroke={p.accent}
          strokeWidth={1}
          strokeDasharray="2 3"
          opacity={0.6}
        />
      </svg>
    ),
  },

  threads: {
    title: "No messages yet.",
    sub: "Quiet wings. When someone reaches out, their thread will land here.",
    moth: { size: 48, x: 96, y: 28, rot: 20 },
    Scene: (p) => (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <g
          stroke={p.accent}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x={44} y={84} width={152} height={74} rx={3} fill={p.accentBg} />
          <path d="M 44 92 L 120 138 L 196 92" />
          <path d="M 44 158 L 96 122" />
          <path d="M 196 158 L 144 122" />
        </g>
      </svg>
    ),
  },

  apps: {
    title: "Nothing sent yet.",
    sub: "Hawk-moths cross continents, but only after they take off. Send a message to launch your first.",
    moth: { size: 42, x: 138, y: 56, rot: 55 },
    Scene: (p) => (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <path
          stroke={p.accent}
          strokeWidth={1}
          fill="none"
          strokeDasharray="1 4"
          strokeLinecap="round"
          d="M 4 152 Q 80 130 130 100"
        />
        <g
          stroke={p.accent}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            fill={p.accentBg}
            d="M 60 122 L 224 32 L 162 102 L 132 138 L 122 108 L 60 122 Z"
          />
          <path d="M 162 102 L 132 138" />
          <path d="M 162 102 L 122 108" />
        </g>
      </svg>
    ),
  },

  platform: {
    title: "Nothing here yet.",
    sub: "This corner is bare. Check back as more people and projects join.",
    moth: { size: 36, x: 194, y: 94, rot: 200 },
    Scene: (p) => (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <line
          x1={0}
          y1={148}
          x2={240}
          y2={148}
          stroke={p.muted}
          strokeWidth={1}
          strokeDasharray="1 4"
        />
        <path
          stroke={p.accent}
          strokeWidth={1.2}
          fill="none"
          strokeLinecap="round"
          d="M 56 148 Q 58 130 54 116"
        />
        <path
          stroke={p.accent}
          strokeWidth={1.2}
          fill="none"
          strokeLinecap="round"
          d="M 188 148 Q 190 132 186 122"
        />
      </svg>
    ),
  },

  filters: {
    title: "No matches.",
    sub: "Hawk-moths home in by scent, and your filters narrow the bouquet. Loosen a few and the field opens up.",
    moth: { size: 68, x: 66, y: 46, rot: 245 },
    Scene: (p) => (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <circle
          cx={100}
          cy={80}
          r={64}
          stroke={p.accent}
          strokeWidth={2.4}
          fill="none"
        />
        <circle
          cx={100}
          cy={80}
          r={58}
          stroke={p.accent}
          strokeWidth={1}
          fill={p.accentBg}
        />
        <line
          x1={148}
          y1={126}
          x2={208}
          y2={186}
          stroke={p.accent}
          strokeWidth={6}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
};

// ─── component ─────────────────────────────────────────────────────

export type MothEmptyStateProps = {
  variant: MothVariant;
  title?: string;
  sub?: string;
  ctx?: string;
};

export const MothEmptyState = ({
  variant,
  title,
  sub,
  ctx,
}: MothEmptyStateProps) => {
  const v = VARIANTS[variant];

  // Use the existing token CSS vars. `gold` is the accent in both
  // modes; `gold/12` is the soft-fill we use as accentBg; `muted`
  // text colour reads as the dashed-line tone.
  const palette: SceneProps = {
    accent: "hsl(var(--gold, 38 92% 50%))",
    accentBg: "color-mix(in oklab, hsl(var(--gold, 38 92% 50%)) 12%, transparent)",
    muted: "hsl(var(--muted-foreground, 215 16% 47%))",
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
      <div
        className="relative mb-5"
        style={{ width: SCENE_W, height: SCENE_H }}
      >
        <v.Scene {...palette} />
        <img
          src={mothImage}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position: "absolute",
            width: v.moth.size,
            height: v.moth.size,
            left: v.moth.x,
            top: v.moth.y,
            transform: `rotate(${v.moth.rot}deg)`,
            // The PNG is a dark silhouette; the .dark wrapper class
            // (set on <html> by useTheme) inverts it for dark mode.
            // Light mode keeps it natural.
            userSelect: "none",
          }}
          className="dark:invert dark:brightness-90 dark:saturate-50 dark:hue-rotate-180"
        />
      </div>
      <h3 className="font-display text-lg leading-tight tracking-tight text-foreground mb-2">
        {title ?? v.title}
      </h3>
      <p className="max-w-[300px] text-sm leading-relaxed text-muted-foreground">
        {sub ?? v.sub}
      </p>
      {ctx ? (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {ctx}
        </p>
      ) : null}
    </div>
  );
};
