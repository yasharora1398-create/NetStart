#!/usr/bin/env node
/**
 * One-shot migration script: rewrite every `react-router-dom` import
 * in src/** to the in-tree compat shim at `@/lib/router-compat`.
 *
 * The shim exposes the same identifiers (Link, NavLink, useNavigate,
 * useLocation, Navigate, useParams), so call sites stay identical.
 * Anything that does NOT have a compat equivalent (BrowserRouter,
 * Routes, Route, Outlet) is left flagged in the console output so we
 * can fix those manually -- those only live in App.tsx anyway, and
 * App.tsx itself is being deleted as part of this migration.
 *
 * Run from repo root: `node scripts/migrate-router-imports.js`.
 */
const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "..", "src");
const KNOWN_COMPAT = new Set([
  "Link",
  "NavLink",
  "useNavigate",
  "useLocation",
  "useParams",
  "Navigate",
]);
const KNOWN_REMOVE = new Set([
  // Router shell pieces that only existed in App.tsx; the App Router
  // owns this responsibility now so we drop these on the floor.
  "BrowserRouter",
  "Routes",
  "Route",
  "Outlet",
  "Router",
  "RouterProvider",
  "createBrowserRouter",
]);

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (full.endsWith(".ts") || full.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

const files = walk(SRC);
let touched = 0;
const warnings = [];

for (const file of files) {
  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("react-router-dom")) continue;

  // Pattern: import { X, Y, Z } from "react-router-dom";
  // (single-line; multi-line imports were grepped and none exist.)
  const importRe =
    /import\s*\{\s*([^}]+)\s*\}\s*from\s*["']react-router-dom["'];?/g;
  src = src.replace(importRe, (match, named) => {
    const items = named
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const compat = [];
    const dropped = [];
    for (const item of items) {
      const base = item.split(/\s+as\s+/)[0].trim();
      if (KNOWN_COMPAT.has(base)) compat.push(item);
      else if (KNOWN_REMOVE.has(base)) dropped.push(base);
      else compat.push(item); // unknown identifier, keep it and warn
    }

    if (dropped.length) {
      warnings.push(
        `${path.relative(SRC, file)}: dropping ${dropped.join(", ")}`,
      );
    }

    if (compat.length === 0) return "";
    return `import { ${compat.join(", ")} } from "@/lib/router-compat";`;
  });

  fs.writeFileSync(file, src, "utf8");
  touched++;
  console.log(`updated ${path.relative(SRC, file)}`);
}

if (warnings.length) {
  console.log("\nManual review needed for:");
  for (const w of warnings) console.log("  " + w);
}
console.log(`\n${touched} file(s) rewritten.`);
