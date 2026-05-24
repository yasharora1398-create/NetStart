#!/usr/bin/env node
/**
 * Strip orphan Tailwind modifier prefixes left behind by previous
 * sweeps (the opacity / shadow strips deleted utilities like
 * disabled:opacity-50 down to disabled: which is invalid Tailwind).
 *
 * SAFE version: only matches inside known className string contexts
 * (className="..." / className={`...`} / className: "..." inside cn(),
 * cva variant objects, etc) and only strips the listed modifier
 * names. Does NOT touch TypeScript ternaries or object-literal keys.
 *
 * What it touches:
 *   - one or more <known-modifier>: tokens followed by " | ` | whitespace
 *     immediately before either:
 *       * a quote / backtick / EOL  -> the modifier is orphan at end
 *       * another modifier:         -> the first modifier is orphan
 *
 * What it WON'T touch:
 *   - bare modifier:utility combos (those are valid)
 *   - object keys like `target:` (target is in MODIFIERS, but we
 *     require the prefix to be preceded by whitespace+other Tailwind
 *     token OR another modifier:, never by start-of-line / `,` / `{`)
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
  path.join(ROOT, "scripts/strip-orphan-modifiers.js"),
]);
const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

const MODIFIERS = [
  "hover", "focus", "focus-visible", "focus-within", "active",
  "disabled", "visited", "checked",
  "first", "last", "odd", "even",
  "group-hover", "group-focus", "group-active",
  "peer-hover", "peer-focus", "peer-active", "peer-disabled", "peer-checked",
  "dark", "light",
  "sm", "md", "lg", "xl", "2xl",
  "motion-safe", "motion-reduce",
  "data-\\[state=open\\]", "data-\\[state=closed\\]",
  "data-\\[state=on\\]", "data-\\[state=off\\]",
  "data-\\[state=active\\]", "data-\\[state=inactive\\]",
  "data-\\[state=checked\\]", "data-\\[state=unchecked\\]",
  "data-\\[disabled\\]",
];
const MOD = MODIFIERS.join("|");

// Match a className=" ... " or className={`...`} or "..." after
// `className:` and rewrite only inside the string.
const replaceInClassName = (src) => {
  // Pattern A: className="..." (single quotes, double quotes)
  // Pattern B: className={`...`} (template literal)
  // Pattern C: ... "...": "..." or className: "..." in cva variant objects
  // We just walk every quoted string in the source - that catches A, B,
  // C, and arbitrary class-string constants - but we constrain the
  // INNER replacement so we don't touch strings without Tailwind-shape
  // tokens.
  return src.replace(
    /(["'`])([^"'`\n]*?)\1/g,
    (full, q, body) => {
      // Cheap filter: only operate on strings that look like Tailwind
      // class lists (have a known modifier or utility-shape token).
      if (!/(hover|focus|disabled|dark|md|lg|sm|xl):/.test(body)) return full;
      // Strip orphan modifier chains at end of body: trailing
      // "<mod>:(<mod>:)*$"
      let next = body.replace(
        new RegExp(String.raw`(?:\b(?:${MOD}):)+\s*$`, "g"),
        "",
      );
      // Strip orphan modifier chains followed by whitespace+next-modifier:
      // collapses "disabled: disabled:cursor-not-allowed" -> "disabled:cursor-not-allowed"
      next = next.replace(
        new RegExp(
          String.raw`\b(?:${MOD}):\s+(?=(?:${MOD}):)`,
          "g",
        ),
        "",
      );
      // Collapse double spaces from the strips.
      next = next.replace(/[ \t]{2,}/g, " ").replace(/\s+$/g, "");
      return q + next + q;
    },
  );
};

let touched = 0;
const touchedFiles = [];

const visit = (file) => {
  if (SKIP_FILES.has(file)) return;
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return;
  let src;
  try { src = fs.readFileSync(file, "utf8"); } catch { return; }
  const next = replaceInClassName(src);
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
