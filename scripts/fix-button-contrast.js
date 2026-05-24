#!/usr/bin/env node
/**
 * Contrast sweep for AA (4.5:1 normal, 3:1 large text).
 *
 * The bg-gold (= bg-primary) token is dark forest green in light mode
 * and lighter sage in dark mode. White text on the dark-mode sage
 * only hits ~3.4:1 which fails AA for normal text. The fix is to
 * route every bg-gold / bg-primary surface through the paired
 * text-primary-foreground token, which is white in light mode and
 * near-black in dark mode - both above 5:1 against the corresponding
 * primary background.
 *
 * Sweeps:
 *   text-white-foreground            -> text-primary-foreground
 *     (the -foreground suffix on -white was a typo; the token doesn't
 *      exist so Tailwind dropped it silently and the text inherited
 *      the parent foreground = near-white in dark mode = invisible
 *      on green)
 *   bg-gold[^\"`]*text-white\b       -> swap text-white for text-primary-foreground
 *   bg-primary[^\"`]*text-white\b    -> same
 *   bg-card[^\"`]*text-white\b       -> text-foreground (white on white was invisible)
 *     The bg-card variant is the round icon buttons in Match etc;
 *     text-foreground stays dark on white card in light, light on
 *     dark card in dark - both contrast safe. Hover state usually
 *     adds hover:bg-gold + hover:text-primary-foreground separately.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROOTS = ["src"];
const SKIP_DIRS = new Set([
  "node_modules", ".next", ".turbo", "dist", "build", ".git",
  "coverage", ".vercel",
]);
const SKIP_FILES = new Set([
  path.join(ROOT, "scripts/fix-button-contrast.js"),
]);
const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

let touched = 0;
const touchedFiles = [];

const visit = (file) => {
  if (SKIP_FILES.has(file)) return;
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return;
  let src;
  try { src = fs.readFileSync(file, "utf8"); } catch { return; }
  let next = src;

  // 1. The invalid token. Always safe to swap.
  next = next.replace(/\btext-white-foreground\b/g, "text-primary-foreground");

  // 2. text-white when bg-gold / bg-primary is in the same className
  //    string. The lookahead/lookbehind is "are we inside a string
  //    literal that also mentions bg-gold or bg-primary?" Approximate:
  //    operate inside a single line, require bg-(gold|primary) and
  //    text-white in the same class string.
  next = next.replace(
    /(\bclassName\s*=\s*[`"'][^`"']*\bbg-(?:gold|primary)\b[^`"']*?)\btext-white\b/g,
    "$1text-primary-foreground",
  );
  next = next.replace(
    /(\bclassName\s*=\s*[`"'][^`"']*\b)text-white\b([^`"']*\bbg-(?:gold|primary)\b)/g,
    "$1text-primary-foreground$2",
  );

  // 3. text-white when bg-card is in the same className string. White
  //    text on a white card was invisible in light mode (the recurring
  //    icon-button bug). text-foreground is dark in light + light in
  //    dark, contrast-safe both modes.
  next = next.replace(
    /(\bclassName\s*=\s*[`"'][^`"']*\bbg-card\b[^`"']*?)\btext-white\b/g,
    "$1text-foreground",
  );
  next = next.replace(
    /(\bclassName\s*=\s*[`"'][^`"']*\b)text-white\b([^`"']*\bbg-card\b)/g,
    "$1text-foreground$2",
  );

  // 4. Same swaps for bare class strings (e.g. constants like
  //    `className: "border-gold bg-gold text-white"`). Match any
  //    quoted string with bg-(gold|primary) + text-white.
  next = next.replace(
    /([`"'][^`"']*\bbg-(?:gold|primary)\b[^`"']*?)\btext-white\b/g,
    "$1text-primary-foreground",
  );
  next = next.replace(
    /([`"'][^`"']*\b)text-white\b([^`"']*\bbg-(?:gold|primary)\b)/g,
    "$1text-primary-foreground$2",
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
