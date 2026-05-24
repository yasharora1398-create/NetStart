#!/usr/bin/env node
/**
 * Cleanup pass after fix-mojibake.js. That script handled the
 * three-byte mojibake sequences (â€™ â€" â€"  â€¦  â†'  Â· Â© Ã—) but
 * a few files had the smart-punctuation chars in pure form too
 * (typed directly, copied from a design doc, or surviving as the
 * orphaned third byte of a partial mojibake fix). Stripping them
 * here so:
 *   - " " (U+201C/D smart double quotes) -> deleted entirely. They
 *     break JSX string literals when they land between double
 *     quotes ('"…"' becomes '""…"' which closes the string early)
 *     and they aren't intentional anywhere in this repo.
 *   - — – (em-dash, en-dash) -> '-' per the project's no-em-dash
 *     rule.
 *   - … (ellipsis) -> '...'
 *   - ' ' (smart single quotes) -> KEPT as-is; they're valid
 *     apostrophes in prose ("we don't") and don't break anything.
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
  path.join(ROOT, "scripts/strip-orphan-smartquotes.js"),
]);
const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".css", ".html"]);

const SUBS = [
  ["“", ""],   // " left smart double quote -> delete
  ["”", ""],   // " right smart double quote -> delete
  ["—", "-"],  // em-dash -> hyphen
  ["–", "-"],  // en-dash -> hyphen
  ["…", "..."],
];

let touched = 0;
const touchedFiles = [];

const visit = (file) => {
  if (SKIP_FILES.has(file)) return;
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return;
  let src;
  try { src = fs.readFileSync(file, "utf8"); } catch { return; }
  let next = src;
  for (const [from, to] of SUBS) next = next.split(from).join(to);
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
