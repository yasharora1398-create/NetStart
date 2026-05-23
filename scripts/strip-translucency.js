#!/usr/bin/env node
/**
 * Strip every translucent + blur + glow Tailwind utility from the
 * source tree so the rendered surfaces are fully opaque, with zero
 * see-through chrome, halo glows, or frosted blurs.
 *
 * Replacements (case-sensitive, word-bounded where it matters):
 *   1. <prop>-<color>/<N> -> <prop>-<color>   (drop the alpha slash)
 *      props covered: bg, text, border, ring, from, via, to, divide,
 *      placeholder, fill, stroke, outline, decoration, accent, caret,
 *      shadow, ring-offset
 *   2. backdrop-blur(-[a-z0-9]+)? -> removed
 *   3. backdrop-filter, backdrop-saturate(-[a-z0-9]+)? -> removed
 *   4. blur(-[a-z0-9]+)? -> removed   (the filter blur class)
 *   5. mix-blend-[a-z]+ -> removed
 *   6. shadow-glow -> removed
 *   7. drop-shadow-[a-z0-9]+ -> removed   (only the named glow variants)
 *   8. opacity-<N> where N in 5,10,15,...,95 -> removed
 *      (opacity-0 and opacity-100 kept - those are "hidden" / "shown",
 *      not translucent)
 *
 * Skips: scripts/, node_modules/, .next/, dist/, public/m/_expo/ build
 * output, package-lock files, .tsbuildinfo.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const ROOTS = ["src", "mobile"];

const SKIP_DIRS = new Set([
  "node_modules", ".next", ".turbo", "dist", "build", ".git",
  "coverage", ".vercel", "_expo",
]);

const SKIP_FILES = new Set([
  path.join(ROOT, "scripts/strip-translucency.js"),
  path.join(ROOT, "scripts/rename-roles.js"),
  path.join(ROOT, "scripts/rename-builder-to-partner.js"),
  path.join(ROOT, "package-lock.json"),
  path.join(ROOT, "mobile/package-lock.json"),
  path.join(ROOT, "tsconfig.tsbuildinfo"),
]);

const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);

// Tailwind utility property prefixes that accept the `/N` alpha syntax.
const ALPHA_PREFIXES = [
  "bg", "text", "border", "ring", "ring-offset",
  "from", "via", "to",
  "divide", "placeholder", "fill", "stroke",
  "outline", "decoration", "accent", "caret", "shadow",
];

// Build a regex that matches: (prefix)-(token)/N inside a className-ish
// position. Token = one or more identifier chunks separated by dashes,
// optionally with the bracket-arbitrary-value form ending in ].
// We anchor on a leading word boundary so we don't bite halfway into a
// css var or longer identifier.
const ALPHA_RE = new RegExp(
  String.raw`\b(${ALPHA_PREFIXES.join("|")})-([a-zA-Z0-9-]+(?:\[[^\]]+\])?)\/(\d{1,3})\b`,
  "g",
);

// Backdrop-blur and backdrop-saturate utilities (with or without size).
const BACKDROP_RE = /\bbackdrop-(blur|filter|saturate|brightness|contrast|hue-rotate|invert|opacity|sepia|grayscale)(-[a-zA-Z0-9.-]+)?\b/g;

// Filter blur utility (not backdrop). Matches "blur" or "blur-sm" etc.
// Negative lookbehind avoids hitting "backdrop-blur" twice; ALPHA_RE
// already grabbed slashed variants like blur-sm/50 are unusual but
// possible.
const BLUR_RE = /(?<![a-zA-Z])blur(-[a-zA-Z0-9]+)?\b/g;

// Mix-blend-mode utilities.
const MIX_BLEND_RE = /\bmix-blend-[a-zA-Z-]+\b/g;

// Brand shadow-glow utility - the legacy "halo" shadow.
const SHADOW_GLOW_RE = /\bshadow-glow\b/g;

// drop-shadow with a named variant (drop-shadow-glow / drop-shadow-md
// is fine, but the alpha-channel'd shadow- variants we want to lose).
// Strip every drop-shadow-* utility plus bare "drop-shadow".
const DROP_SHADOW_RE = /\bdrop-shadow(-[a-zA-Z0-9]+)?\b/g;

// Opacity utilities at non-extreme values. Keep opacity-0 / 100;
// 0 = fully hidden (acceptable per user spirit), 100 = no-op.
const OPACITY_RE = /\bopacity-([0-9]+)\b/g;

const stripFromText = (src) => {
  let next = src;

  // 1. alpha-slash utilities: drop the "/N" suffix.
  next = next.replace(ALPHA_RE, (_m, prefix, token) => `${prefix}-${token}`);

  // 2. backdrop-* utilities removed entirely.
  next = next.replace(BACKDROP_RE, "");

  // 3. filter blur classes removed.
  next = next.replace(BLUR_RE, "");

  // 4. mix-blend removed.
  next = next.replace(MIX_BLEND_RE, "");

  // 5. shadow-glow removed.
  next = next.replace(SHADOW_GLOW_RE, "");

  // 6. drop-shadow-* removed.
  next = next.replace(DROP_SHADOW_RE, "");

  // 7. opacity-N where 0 < N < 100 removed.
  next = next.replace(OPACITY_RE, (m, n) => {
    const v = parseInt(n, 10);
    if (v === 0 || v === 100) return m;
    return "";
  });

  // Collapse any double-spaces we created in className strings.
  next = next.replace(/[ \t]{2,}/g, " ");
  // Trim trailing whitespace on lines we may have hollowed.
  next = next.replace(/[ \t]+$/gm, "");

  return next;
};

let touched = 0;
const touchedFiles = [];

const visit = (file) => {
  if (SKIP_FILES.has(file)) return;
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return;
  if (file.endsWith(".tsbuildinfo")) return;
  if (file.endsWith("package-lock.json")) return;
  let src;
  try {
    src = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }
  const next = stripFromText(src);
  if (next !== src) {
    fs.writeFileSync(file, next, "utf8");
    touched++;
    touchedFiles.push(path.relative(ROOT, file));
  }
};

const walk = (dir) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.isFile()) visit(full);
  }
};

for (const r of ROOTS) {
  const full = path.join(ROOT, r);
  if (fs.existsSync(full)) walk(full);
}

console.log(`${touched} files updated`);
for (const f of touchedFiles) console.log("  ", f);
