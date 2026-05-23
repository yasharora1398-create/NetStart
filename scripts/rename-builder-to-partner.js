#!/usr/bin/env node
/**
 * One-shot rename of the candidate role label from "builder" to
 * "partner" everywhere the user can see it. Case-preserved.
 *
 * Substitutions (longest-first to avoid double-rewrite):
 *   Builders -> Partners       BUILDERS -> PARTNERS    builders -> partners
 *   Builder  -> Partner        BUILDER  -> PARTNER     builder  -> partner
 *
 * Targets: src/, mobile/, supabase/scripts/, public/, scripts/
 *   (skips this script itself, supabase/migrations history, binary
 *   assets, node_modules, .next, dist, lockfiles, and tsbuildinfo)
 *
 * Pairs with migration 0032_rename_builder_role_to_partner.sql which
 * rewrites existing auth.users.user_metadata.role values from
 * 'builder' to 'partner'.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const ROOTS = ["src", "mobile", "supabase/scripts", "public", "scripts"];

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  "dist",
  "build",
  ".git",
  "coverage",
  ".vercel",
]);

const SKIP_FILES = new Set([
  path.join(ROOT, "scripts/rename-builder-to-partner.js"),
  path.join(ROOT, "scripts/rename-roles.js"),
  path.join(ROOT, "mobile/package-lock.json"),
  path.join(ROOT, "package-lock.json"),
  path.join(ROOT, "tsconfig.tsbuildinfo"),
]);

const ALLOWED_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".md", ".html", ".css", ".sql", ".xml", ".json",
]);

const SUBS = [
  ["Builders", "Partners"],
  ["BUILDERS", "PARTNERS"],
  ["builders", "partners"],
  ["Builder",  "Partner"],
  ["BUILDER",  "PARTNER"],
  ["builder",  "partner"],
];

const applySubs = (text) => {
  let out = text;
  for (const [from, to] of SUBS) {
    out = out.split(from).join(to);
  }
  return out;
};

let touched = 0;
const touchedFiles = [];

const visitFile = (file) => {
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
  if (!/[Bb][Uu][Ii][Ll][Dd][Ee][Rr]/.test(src)) return;
  const next = applySubs(src);
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
    else if (e.isFile()) visitFile(full);
  }
};

for (const r of ROOTS) {
  const full = path.join(ROOT, r);
  if (fs.existsSync(full)) walk(full);
}

console.log(`${touched} files updated`);
for (const f of touchedFiles) console.log("  ", f);
