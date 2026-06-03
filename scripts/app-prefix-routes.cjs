/**
 * One-shot bulk rewrite: re-point internal app routes from bare
 * paths (/match, /mynet, ...) to /app/match, /app/mynet, etc.
 *
 * Triggered after the route folders were physically moved under
 * src/app/app/. The desktop redirects in next.config.ts cover any
 * external link or bookmark that still uses the bare path, but
 * internal Links / navigate() calls should point at the canonical
 * /app/* URLs so we don't pay a redirect hop on every click.
 *
 * Excluded:
 *  - Mobile-specific components (BottomNav, MobileBottomNav,
 *    MobileHome) where phone-UA redirects to /m/* take over anyway.
 *  - IconRail: public marketing rail, may render on logged-out
 *    surfaces; updated separately if/when it stays on the new home.
 *  - Sidebar: already updated manually.
 *  - next.config.ts: redirects intentionally key off the bare paths.
 *
 * Run with: node scripts/app-prefix-routes.cjs
 */
const fs = require("fs");
const path = require("path");

const SKIP = new Set([
  "src/components/BottomNav.tsx",
  "src/components/netstart/MobileBottomNav.tsx",
  "src/components/marketing/MobileHome.tsx",
  "src/components/netstart/IconRail.tsx",
  "src/components/netstart/Sidebar.tsx",
]);

const ROUTES = [
  "match",
  "mynet",
  "saved",
  "chats",
  "settings",
  "perks",
  "applications",
  "boost",
  "verified",
  "spotlight",
  "admin",
];

// Match a route path only when it is preceded by a quote / backtick
// (so we don't touch words that happen to follow a slash inside a
// string of prose), and only when the segment ends in a delimiter
// (quote / slash / question / hash). The route segment itself stays
// captured as group 1 so we can preserve trailing /:id parts.
const PATTERNS = ROUTES.map((r) => ({
  re: new RegExp("(['\"`])/" + r + "(?=['\"`/?#])", "g"),
  rep: "$1/app/" + r,
}));

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
      walk(fp, out);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      out.push(fp);
    }
  }
}

const files = [];
walk("src", files);

let changed = 0;
const changedFiles = [];
for (const fp of files) {
  const rel = fp.replace(/\\/g, "/");
  if (SKIP.has(rel)) continue;
  let src = fs.readFileSync(fp, "utf8");
  const orig = src;
  for (const { re, rep } of PATTERNS) {
    src = src.replace(re, rep);
  }
  if (src !== orig) {
    fs.writeFileSync(fp, src);
    changed++;
    changedFiles.push(rel);
  }
}
console.log("Changed", changed, "files:");
for (const f of changedFiles) console.log("  " + f);
