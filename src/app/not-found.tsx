"use client";
// Next.js renders this for unmatched routes (replacing react-router's
// catch-all <Route path="*">). The existing NotFound page handles the
// UI; this file just plugs it into the App Router's not-found slot.
export { default } from "@/views/NotFound";
