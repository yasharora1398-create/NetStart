#!/usr/bin/env node
/**
 * One-shot rename of legacy role names to the two canonical ones
 * the user wants visible everywhere: "builder" and "founder".
 *
 * Specifically:
 *   - "operator(s)" -> "builder(s)"   (case-preserved)
 *   - "Operator(s)" -> "Builder(s)"
 *   - The Match.tsx internal variable `userMode: "builder" | "looker"`
 *     is renamed in-file via dedicated edits elsewhere.
 *
 * Admin-staff context files are excluded: "Operator email" in
 * Admin.tsx/Sidebar.tsx/IconRail.tsx refer to platform admins, not
 * the candidate role.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const SKIP_FILES = new Set([
  path.join(root, "src/views/Admin.tsx"),
  path.join(root, "src/components/netstart/Sidebar.tsx"),
  path.join(root, "src/components/netstart/IconRail.tsx"),
  path.join(root, "src/components/marketing/WhySection.tsx"),
  path.join(root, "scripts/rename-roles.js"),
]);

const TARGETS = [
  "src/views",
  "src/components/mynet",
  "src/components/netstart",
  "src/components/chat",
];

let touched = 0;

const replaceInFile = (file) => {
  if (SKIP_FILES.has(file)) return;
  if (!/\.(tsx?|jsx?|md)$/.test(file)) return;
  const src = fs.readFileSync(file, "utf8");
  let next = src;
  next = next.replace(/Operators/g, "Builders");
  next = next.replace(/operators/g, "builders");
  next = next.replace(/Operator/g, "Builder");
  next = next.replace(/operator/g, "builder");
  if (next !== src) {
    fs.writeFileSync(file, next, "utf8");
    console.log("renamed:", path.relative(root, file));
    touched++;
  }
};

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) replaceInFile(full);
  }
};

for (const t of TARGETS) {
  const full = path.join(root, t);
  if (fs.existsSync(full)) walk(full);
}

console.log(`${touched} files updated`);
