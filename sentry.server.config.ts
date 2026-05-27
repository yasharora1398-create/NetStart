/**
 * Sentry server-side init (Node runtime). Captures errors thrown in
 * Server Components, route handlers, server actions, and middleware
 * that runs on the Node runtime. Inert until SENTRY_DSN is set.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
 Sentry.init({
 dsn,
 environment: process.env.VERCEL_ENV ?? "development",
 release: process.env.VERCEL_GIT_COMMIT_SHA,
 tracesSampleRate: 0.1,
 enabled: process.env.NODE_ENV === "production",
 });
}
