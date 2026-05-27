/**
 * Sentry browser-side init. Captures React render errors, unhandled
 * Promise rejections, and Supabase RPC failures that bubble up to the
 * client. Inert until NEXT_PUBLIC_SENTRY_DSN is set - safe to commit.
 *
 * Sample rates kept low; raise once we've validated signal vs. noise:
 *   tracesSampleRate: 0.1 -> 10% of transactions get performance traces
 *   replaysOnErrorSampleRate: 1.0 -> 100% of error sessions get replay
 *   replaysSessionSampleRate: 0.0 -> 0% of normal sessions (privacy + cost)
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
 Sentry.init({
 dsn,
 environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
 release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
 tracesSampleRate: 0.1,
 replaysOnErrorSampleRate: 1.0,
 replaysSessionSampleRate: 0.0,
 integrations: [
 Sentry.replayIntegration({
 maskAllText: false,
 blockAllMedia: false,
 }),
 ],
 // Don't ship dev-only errors (HMR, fast refresh noise) to Sentry.
 enabled: process.env.NODE_ENV === "production",
 });
}
