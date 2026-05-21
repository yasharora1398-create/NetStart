/**
 * Hummingbird hawk-moth empty states.
 *
 * Twelve scene variants, every one paired with the same dark-moth
 * silhouette PNG (auto-inverted under .dark). Each scene is drawn in
 * inline SVG with theme-aware CSS-variable strokes/fills so light and
 * dark modes both work without separate assets.
 *
 * Variants
 *   blank          haven't started - bud + dashed flight line
 *   caught         caught up - horizon, perched moth
 *   saves          saves empty - oversized bookmark
 *   threads        no messages - envelope on desk
 *   apps           none sent - paper airplane
 *   platform       nothing yet - minimal scene, drifting moth
 *   filters        no matches - magnifying glass
 *   bio            no bio yet - page with quill
 *   skills         no skills set - three drifting tag chips
 *   notifications  no notifications - bell with clapper
 *   queue          admin queue empty - clipboard, checked
 *   lost           profile not found - broken compass / dashed orbit
 *
 * Motion: the moth gets the global .moth-hover oscillation
 * (defined in src/index.css). The whole container fades + lifts
 * in via .moth-emerge. Scene accents do a slow breath via
 * .moth-breathe so the SVG never feels frozen.
 *
 * Sizing: pass `compact` for tight contexts (dropdowns, small panels).
 * Compact halves the scene + moth and trims the type sizes.
 */
import mothImage from "@/assets/moth.png";
import { assetUrl } from "@/lib/asset-url";

export type MothVariant =
  | "blank"
  | "caught"
  | "saves"
  | "threads"
  | "apps"
  | "platform"
  | "filters"
  | "bio"
  | "skills"
  | "notifications"
  | "queue"
  | "lost";

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
          className="moth-breathe"
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
          className="moth-breathe"
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
          className="moth-breathe"
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

  // Open page with a quill resting across it. Moth on the upper corner.
  bio: {
    title: "No pitch yet.",
    sub: "Hawk-moths follow the scent of the bloom. Write a few lines and the right people pick you up.",
    moth: { size: 44, x: 168, y: 12, rot: 25 },
    Scene: (p) => (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {/* page */}
        <path
          stroke={p.accent}
          strokeWidth={1.6}
          fill={p.accentBg}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M 40 28 H 168 L 188 48 V 156 H 40 Z"
        />
        {/* folded corner */}
        <path
          stroke={p.accent}
          strokeWidth={1.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M 168 28 V 48 H 188"
        />
        {/* writing lines */}
        <line x1={56} y1={70} x2={170} y2={70} stroke={p.accent} strokeWidth={1} strokeDasharray="2 3" opacity={0.55} />
        <line x1={56} y1={88} x2={160} y2={88} stroke={p.accent} strokeWidth={1} strokeDasharray="2 3" opacity={0.55} />
        <line x1={56} y1={106} x2={172} y2={106} stroke={p.accent} strokeWidth={1} strokeDasharray="2 3" opacity={0.55} />
        <line x1={56} y1={124} x2={130} y2={124} stroke={p.accent} strokeWidth={1} strokeDasharray="2 3" opacity={0.55} />
        {/* quill */}
        <path
          stroke={p.accent}
          strokeWidth={1.6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M 56 152 L 142 78"
        />
        <path
          stroke={p.accent}
          strokeWidth={1.4}
          fill={p.accentBg}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M 142 78 q 10 -4 16 4 q -6 10 -16 -4 Z"
        />
      </svg>
    ),
  },

  // Three tag chips drifting on a dashed thread. Moth perched on one.
  skills: {
    title: "No skills set.",
    sub: "Skills act as the breadcrumbs that bring matches to your door. Add a few and the search opens up.",
    moth: { size: 36, x: 38, y: 22, rot: 320 },
    Scene: (p) => (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {/* dashed thread */}
        <path
          stroke={p.accent}
          strokeWidth={1}
          fill="none"
          strokeDasharray="1 4"
          strokeLinecap="round"
          d="M 32 56 Q 96 36 132 96 T 216 122"
        />
        {/* chip 1 (top-left, where moth lands) */}
        <rect
          x={28}
          y={52}
          width={62}
          height={22}
          rx={11}
          stroke={p.accent}
          strokeWidth={1.6}
          fill={p.accentBg}
        />
        <circle cx={42} cy={63} r={2.2} fill={p.accent} />
        <line x1={50} y1={63} x2={82} y2={63} stroke={p.accent} strokeWidth={1.2} strokeLinecap="round" />
        {/* chip 2 (middle) */}
        <rect
          className="moth-breathe"
          x={106}
          y={84}
          width={70}
          height={22}
          rx={11}
          stroke={p.accent}
          strokeWidth={1.6}
          fill={p.accentBg}
        />
        <circle cx={120} cy={95} r={2.2} fill={p.accent} />
        <line x1={128} y1={95} x2={168} y2={95} stroke={p.accent} strokeWidth={1.2} strokeLinecap="round" />
        {/* chip 3 (bottom-right) */}
        <rect
          x={156}
          y={120}
          width={64}
          height={22}
          rx={11}
          stroke={p.accent}
          strokeWidth={1.6}
          fill={p.accentBg}
        />
        <circle cx={170} cy={131} r={2.2} fill={p.accent} />
        <line x1={178} y1={131} x2={212} y2={131} stroke={p.accent} strokeWidth={1.2} strokeLinecap="round" />
      </svg>
    ),
  },

  // Soft bell with a single clapper. Moth resting on the crown.
  notifications: {
    title: "No notifications.",
    sub: "All quiet. New requests, accepts, and messages land here the moment they happen.",
    moth: { size: 40, x: 102, y: 14, rot: 350 },
    Scene: (p) => (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {/* bell crown peg */}
        <line x1={120} y1={36} x2={120} y2={44} stroke={p.accent} strokeWidth={1.6} strokeLinecap="round" />
        {/* bell body */}
        <path
          stroke={p.accent}
          strokeWidth={1.6}
          fill={p.accentBg}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M 120 44 C 92 44 76 70 76 112 L 76 128 L 164 128 L 164 112 C 164 70 148 44 120 44 Z"
        />
        {/* bell rim */}
        <line x1={70} y1={128} x2={170} y2={128} stroke={p.accent} strokeWidth={1.6} strokeLinecap="round" />
        {/* clapper */}
        <circle className="moth-breathe" cx={120} cy={138} r={5} stroke={p.accent} strokeWidth={1.4} fill={p.accentBg} />
        {/* soft sound waves */}
        <path stroke={p.accent} strokeWidth={1} fill="none" strokeDasharray="1 4" strokeLinecap="round" d="M 48 90 Q 36 86 28 78" />
        <path stroke={p.accent} strokeWidth={1} fill="none" strokeDasharray="1 4" strokeLinecap="round" d="M 192 90 Q 204 86 212 78" />
      </svg>
    ),
  },

  // Clipboard with three rows, all checked. Moth on the metal clip.
  queue: {
    title: "Queue is clear.",
    sub: "Nothing waiting for review. New submissions and signups will land here as they arrive.",
    moth: { size: 38, x: 96, y: 8, rot: 340 },
    Scene: (p) => (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {/* clipboard body */}
        <rect
          x={60}
          y={36}
          width={120}
          height={120}
          rx={4}
          stroke={p.accent}
          strokeWidth={1.6}
          fill={p.accentBg}
        />
        {/* metal clip */}
        <rect
          x={100}
          y={26}
          width={40}
          height={18}
          rx={3}
          stroke={p.accent}
          strokeWidth={1.6}
          fill={p.accentBg}
        />
        {/* rows */}
        {[78, 102, 126].map((y) => (
          <g key={y}>
            <circle className="moth-breathe" cx={80} cy={y} r={5.5} stroke={p.accent} strokeWidth={1.4} fill={p.accentBg} />
            <path d={`M 76 ${y} l 3 3 l 6 -6`} stroke={p.accent} strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <line x1={94} y1={y} x2={162} y2={y} stroke={p.accent} strokeWidth={1} strokeDasharray="2 3" opacity={0.5} />
          </g>
        ))}
      </svg>
    ),
  },

  // Compass with a broken needle. Dashed outer orbit. Moth drifting away from center.
  lost: {
    title: "No such profile.",
    sub: "The trail goes cold here. The person you're looking for may have left the platform.",
    moth: { size: 36, x: 188, y: 28, rot: 25 },
    Scene: (p) => (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {/* dashed outer orbit */}
        <circle
          cx={108}
          cy={88}
          r={70}
          stroke={p.muted}
          strokeWidth={1}
          strokeDasharray="2 5"
          fill="none"
        />
        {/* compass body */}
        <circle
          className="moth-breathe"
          cx={108}
          cy={88}
          r={48}
          stroke={p.accent}
          strokeWidth={1.6}
          fill={p.accentBg}
        />
        {/* broken N axis */}
        <line x1={108} y1={50} x2={108} y2={70} stroke={p.accent} strokeWidth={1.4} strokeLinecap="round" />
        <line x1={108} y1={108} x2={108} y2={126} stroke={p.accent} strokeWidth={1.4} strokeLinecap="round" />
        {/* broken E axis */}
        <line x1={70} y1={88} x2={88} y2={88} stroke={p.accent} strokeWidth={1.4} strokeLinecap="round" />
        <line x1={128} y1={88} x2={146} y2={88} stroke={p.accent} strokeWidth={1.4} strokeLinecap="round" />
        {/* off-center pivot */}
        <circle cx={108} cy={88} r={3} fill={p.accent} />
        {/* drifting needle pointing offscreen */}
        <path
          stroke={p.accent}
          strokeWidth={1.6}
          fill={p.accentBg}
          strokeLinejoin="round"
          d="M 108 88 L 152 60 L 142 78 Z"
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
  /** Compact mode for tight contexts (dropdowns, narrow panels). */
  compact?: boolean;
  /** Extra classes appended to the outer wrapper. */
  className?: string;
};

export const MothEmptyState = ({
  variant,
  title,
  sub,
  ctx,
  compact = false,
  className,
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

  // Compact scales the scene to ~58% so it sits gracefully in a
  // dropdown / narrow card without forcing extra height on the
  // surrounding layout.
  const scale = compact ? 0.58 : 1;
  const sceneW = SCENE_W * scale;
  const sceneH = SCENE_H * scale;

  return (
    <div
      className={[
        "moth-emerge flex flex-1 flex-col items-center justify-center text-center",
        compact ? "px-4 py-5" : "px-5 py-8",
        className ?? "",
      ].join(" ")}
    >
      <div
        className={compact ? "relative mb-3" : "relative mb-5"}
        style={{ width: sceneW, height: sceneH }}
      >
        <v.Scene {...palette} />
        <img
          src={assetUrl(mothImage)}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position: "absolute",
            width: v.moth.size * scale,
            height: v.moth.size * scale,
            left: v.moth.x * scale,
            top: v.moth.y * scale,
            // Per-variant rotation is exposed as a CSS variable so the
            // global .moth-hover keyframes can layer translateY on top
            // of it (the animation reads var(--moth-rot)).
            ["--moth-rot" as string]: `${v.moth.rot}deg`,
            transform: `rotate(${v.moth.rot}deg)`,
            // The PNG is a dark silhouette; .dark wrapper inverts.
            userSelect: "none",
          }}
          className="moth-hover dark:invert dark:brightness-90 dark:saturate-50 dark:hue-rotate-180"
        />
      </div>
      <h3
        className={[
          "font-display leading-tight tracking-tight text-foreground mb-2",
          compact ? "text-sm" : "text-lg",
        ].join(" ")}
      >
        {title ?? v.title}
      </h3>
      <p
        className={[
          "leading-relaxed text-muted-foreground",
          compact ? "max-w-[240px] text-xs" : "max-w-[300px] text-sm",
        ].join(" ")}
      >
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
