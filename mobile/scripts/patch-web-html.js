#!/usr/bin/env node
/**
 * Post-export step that patches dist/m/index.html with the mobile-Safari
 * niceties Expo's `output: "single"` mode skips. The `+html.tsx` template
 * only runs under `output: "static"`, so for our single-page export we
 * rewrite the produced HTML in place.
 *
 * Adds:
 * - viewport-fit=cover so content extends under iOS notch + home
 * indicator (no white bezels in Safari).
 * - theme-color meta so Safari tints its chrome to match the dark
 * app shell.
 * - apple-mobile-web-app-* meta so "Add to Home Screen" lands the
 * app in full-screen mode.
 * - html/body { background: #050505 } so the safe-area zones the
 * viewport-fit=cover exposes blend into the app surface instead of
 * flashing white.
 */
const fs = require("fs");
const path = require("path");

const htmlPath = path.resolve(
 __dirname,
 "..",
 "..",
 "public",
 "m",
 "index.html",
);

if (!fs.existsSync(htmlPath)) {
 console.warn(`[patch-web-html] ${htmlPath} not found, skipping.`);
 process.exit(0);
}

let html = fs.readFileSync(htmlPath, "utf8");

// Replace the viewport meta with one that includes viewport-fit=cover.
html = html.replace(
 /<meta\s+name="viewport"[^>]*\/?>/i,
 '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);

// Inject extra meta + body bg style once. Guarded by a sentinel so
// repeated runs don't keep stacking the block.
if (!html.includes('id="polln8-mobile-shell"')) {
 const inject = [
 '<meta name="theme-color" content="#050505" />',
 '<meta name="apple-mobile-web-app-capable" content="yes" />',
 '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
 '<style id="polln8-mobile-shell">html,body{background-color:#050505;}</style>',
 ].join("\n ");
 html = html.replace("</head>", ` ${inject}\n </head>`);
}

fs.writeFileSync(htmlPath, html, "utf8");
console.log("[patch-web-html] dist/m/index.html patched.");
