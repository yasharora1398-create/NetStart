#!/usr/bin/env node
/**
 * UTF-8 mojibake repair. A bunch of source files have characters that
 * were UTF-8 bytes saved as Latin-1 then re-saved as UTF-8 - so the
 * middle-dot `·` (U+00B7, bytes C2 B7) ends up as `Â·`, the copyright
 * `©` ends up as `Â©`, smart quotes/em-dashes/arrows similarly.
 *
 * Replacements (most-specific first so longer mojibake patterns are
 * matched before their prefixes):
 *
 *   â€™       -> '       (right single quote / apostrophe -> straight)
 *   â€œ       -> "       (left double quote -> straight)
 *   â€        -> "       (right double quote, no visible 3rd char)
 *   â€"       -> -       (em-dash; user rule: no em-dashes anywhere)
 *   â€"       -> -       (en-dash; same rule)
 *   â€¦       -> ...     (horizontal ellipsis -> three dots)
 *   â†’       -> ->      (right arrow -> ascii arrow)
 *   â†'       -> ->      (alternate right arrow form)
 *   â€“       -> -       (variant en-dash)
 *   Â·        -> ·       (middle dot - correct char)
 *   Â©        -> ©       (copyright - correct char)
 *   Ã—        -> ×       (multiplication sign - correct char)
 *   Â         -> (drop)  (lone Â from 0xC2 byte without low byte)
 *
 * Each pattern is restored to the modern source-of-truth character
 * (or, in the case of em-/en-dashes, to a hyphen per the project's
 * no-em-dashes rule).
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
  path.join(ROOT, "scripts/fix-mojibake.js"),
]);
const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".css", ".html"]);

// Order matters: longest sequences first so a 3-byte mojibake is
// fully consumed before a 2-byte prefix like Â matches its leading
// byte.
const SUBS = [
  ["â€™", "'"],
  ["â€œ", '"'],
  ["â€", '"'],
  ["â€", '"'],
  ["â€", "-"],
  ["â€", "-"],
  ["â€¦", "..."],
  ["â€“", "-"],
  ["â€”", "-"],
  ["â†’", "->"],
  ["â†'", "->"],
  ["Â·", "·"],
  ["Â©", "©"],
  ["Ã—", "×"],
];

const repair = (text) => {
  let out = text;
  for (const [from, to] of SUBS) {
    out = out.split(from).join(to);
  }
  return out;
};

let touched = 0;
const touchedFiles = [];

const visit = (file) => {
  if (SKIP_FILES.has(file)) return;
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return;
  let src;
  try { src = fs.readFileSync(file, "utf8"); } catch { return; }
  const next = repair(src);
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
