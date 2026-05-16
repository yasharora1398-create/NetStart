#!/usr/bin/env node
/**
 * Adds "use client" to the top of every src/views/*.tsx that
 * doesn't already have it. Lets us convert the app/<route>/page.tsx
 * files from client-side wrappers into server components that
 * export per-page metadata.
 */
const fs = require("fs");
const path = require("path");

const VIEWS = path.resolve(__dirname, "..", "src", "views");
const files = fs.readdirSync(VIEWS).filter((n) => n.endsWith(".tsx"));

let touched = 0;
for (const name of files) {
  const full = path.join(VIEWS, name);
  const src = fs.readFileSync(full, "utf8");
  // Already directive-marked? skip.
  if (/^\s*"use client";/.test(src) || /^\s*'use client';/.test(src)) {
    continue;
  }
  fs.writeFileSync(full, `"use client";\n${src}`, "utf8");
  console.log(`marked use client: views/${name}`);
  touched++;
}
console.log(`${touched} files updated`);
