#!/usr/bin/env node
/**
 * Generates the Next.js App Router page.tsx wrappers for every
 * route in the migrated app. Each wrapper is a one-line client
 * re-export of the existing src/pages/* component, so we don't
 * have to refactor 22 pages into server-renderable shape today.
 *
 * Dynamic routes ([id]) are written by hand below; the simple
 * static routes are generated from a table.
 */
const fs = require("fs");
const path = require("path");

const APP_DIR = path.resolve(__dirname, "..", "src", "app");

const STATIC_ROUTES = [
  // [route segment, page module path under src/pages, comment]
  ["signin", "@/pages/SignIn", "Sign in form. Heavy client state (react-hook-form, auth)."],
  ["signup", "@/pages/SignUp", "Sign up wizard. Client-only."],
  ["check-email", "@/pages/CheckEmail", "Post-signup hint to check inbox."],
  ["forgot-password", "@/pages/ForgotPassword", "Password reset request form."],
  ["reset-password", "@/pages/ResetPassword", "Password reset destination after email link."],
  ["terms", "@/pages/Terms", "Static terms page."],
  ["privacy", "@/pages/Privacy", "Static privacy page."],
  ["how", "@/pages/HowItWorks", "Marketing 'how it works' page."],
  ["authenticated", "@/pages/Authenticated", "Post-verification landing."],
  ["mynet", "@/pages/MyNet", "User's own profile dashboard."],
  ["admin", "@/pages/Admin", "Admin overview + review queue."],
  ["match", "@/pages/Match", "Swipe deck. Heavy real-time + client state."],
  ["saved", "@/pages/Saved", "Bookmarked matches."],
  ["chats", "@/pages/Chats", "Chat list (no thread selected)."],
  ["applications", "@/pages/Applications", "Open applications view."],
  ["standards", "@/pages/Standards", "Standards / vetting page."],
  ["download", "@/pages/DownloadPage", "iOS/Android download promo."],
  ["settings", "@/pages/Settings", "Account settings."],
];

for (const [segment, module, comment] of STATIC_ROUTES) {
  const dir = path.join(APP_DIR, segment);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "page.tsx");
  const content = [
    `"use client";`,
    `// ${comment}`,
    `export { default } from "${module}";`,
    ``,
  ].join("\n");
  fs.writeFileSync(file, content, "utf8");
  console.log(`wrote app/${segment}/page.tsx`);
}
