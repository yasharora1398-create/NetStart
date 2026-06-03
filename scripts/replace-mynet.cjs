/**
 * One-shot rename: every occurrence of the literal token "MyNet"
 * (case-sensitive) becomes "Profile" across the src/ tree. Catches:
 *  - Identifiers: MyNetWizard, MyNetDashboard, MyNetSignupFlow
 *    (their files were already moved to Profile*.tsx in lockstep).
 *  - JSX text, button labels, page titles, toasts.
 *  - Comments.
 *
 * Does NOT touch:
 *  - Lowercase "mynet" (folder names like @/components/mynet/...,
 *    @/lib/mynet-storage, the /app/mynet URL, the polln8.mynet.*
 *    localStorage namespace). Those are not user-visible.
 *  - The views/ProfileEdit.tsx file's function name (already
 *    pre-renamed to ProfileEdit so this script doesn't collide it
 *    with the existing Profile dashboard).
 *
 * Run: node scripts/replace-mynet.cjs
 */
const fs = require("fs");
const path = require("path");

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
      walk(fp, out);
    } else if (/\.(tsx?|jsx?|mjs|cjs|css)$/.test(entry.name)) {
      out.push(fp);
    }
  }
}

const files = [];
walk("src", files);

let changed = 0;
const changedFiles = [];
for (const fp of files) {
  let src = fs.readFileSync(fp, "utf8");
  const orig = src;
  // Match MyNet anywhere (the previous \bMyNet\b regex missed
  // compound identifiers like MyNetWizard, MyNetDashboard,
  // MyNetSignupFlow). "MyNet" doesn't appear as a substring of
  // any unrelated word in this codebase so a bare replace is safe.
  src = src.replace(/MyNet/g, "Profile");
  if (src !== orig) {
    fs.writeFileSync(fp, src);
    changed++;
    changedFiles.push(fp.replace(/\\/g, "/"));
  }
}
console.log(`Changed ${changed} files:`);
for (const f of changedFiles) console.log("  " + f);
