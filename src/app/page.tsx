"use client";
// Homepage. Wraps the existing Home page component (heavy client
// state: useTheme, FadeUp, magnetic CTAs, tilt cards, etc.) so we
// don't have to refactor it into server-renderable shape right now.
// Optimization for server-rendering the marketing hero can come later.
export { default } from "@/views/Home";
