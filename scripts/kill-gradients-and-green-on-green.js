#!/usr/bin/env node
/**
 * Two sweeps:
 *
 * 1. Green-on-green badges (the 'accepted / open-to-work / saved'
 *    pills): every spot using `border-emerald-500 bg-emerald-500
 *    text-emerald-400` collapses 2 greens against each other (~2:1
 *    contrast), which fails AA hard. Swept to
 *    `border-primary bg-primary text-primary-foreground` so the
 *    pill is a solid forest-green chip with white-in-light /
 *    near-black-in-dark text on it (5-7:1 both modes).
 *
 * 2. Decorative gradients (the user wanted NO gradients site-wide):
 *    - bg-gradient-to-{r,br,t,b} from-gold via-gold? to-transparent
 *      decorative overlays get removed in favor of solid bg-card.
 *    - bg-gradient-to-r from-blue-600 to-blue-500 (tutorial primary
 *      button) -> solid bg-primary text-primary-foreground.
 *    - bg-gradient-to-b from-[#222] to-[#0a0a0a] (phone frame bezel)
 *      -> solid bg-foreground.
 *    - bg-gradient-spotlight is kept (the CSS var was already
 *      neutralized to `none` so it's a no-op; removing every usage
 *      would be churn).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROOTS = ["src"];
const SKIP_DIRS = new Set([
  "node_modules", ".next", ".turbo", "dist", "build", ".git",
]);
const SKIP_FILES = new Set([
  path.join(ROOT, "scripts/kill-gradients-and-green-on-green.js"),
]);
const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);

let touched = 0;
const touchedFiles = [];

const visit = (file) => {
  if (SKIP_FILES.has(file)) return;
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return;
  let src;
  try { src = fs.readFileSync(file, "utf8"); } catch { return; }
  let next = src;

  // 1. The accepted-state pill - matches the three classes in any
  //    order in the same class string.
  next = next.replace(
    /border-emerald-500\s+bg-emerald-500\s+text-emerald-400/g,
    "border-primary bg-primary text-primary-foreground",
  );

  // 2. Same pill but the order varies elsewhere (border-emerald +
  //    bg-emerald only, text added separately).
  next = next.replace(
    /border-emerald-500\s+bg-emerald-500\b/g,
    "border-primary bg-primary",
  );

  // 3. Lone text-emerald-400 inside a primary chip should flip to
  //    text-primary-foreground for contrast.
  next = next.replace(/\btext-emerald-400\b/g, "text-primary-foreground");

  // 4. Decorative gradient overlays from gold -> transparent.
  next = next.replace(
    /\bbg-gradient-to-(?:r|br|t|b|tr|tl|bl)\s+from-gold(?:\s+via-gold)?\s+to-transparent\b/g,
    "bg-card",
  );

  // 5. Tutorial primary button (blue gradient).
  next = next.replace(
    /\bbg-gradient-to-r\s+from-blue-600\s+to-blue-500\b/g,
    "bg-primary",
  );
  next = next.replace(
    /\bhover:from-blue-500\s+hover:to-blue-400\b/g,
    "hover:opacity-90",
  );

  // 6. Phone bezel hex-color gradient -> solid foreground.
  next = next.replace(
    /\bbg-gradient-to-b\s+from-\[#222\]\s+to-\[#0a0a0a\]\b/g,
    "bg-foreground",
  );

  // 7. Sidebar/swipe dark scrim gradient.
  next = next.replace(
    /\bbg-gradient-to-t\s+from-obsidian\s+via-obsidian\s+to-transparent\b/g,
    "bg-background",
  );

  if (next !== src) {
    fs.writeFileSync(file, next, "utf8");
    touched++;
    touchedFiles.push(path.relative(ROOT, file));
  }
};

const walk = (dir) => {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
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
