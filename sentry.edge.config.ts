/**
 * Sentry edge-runtime init. Captures errors from edge middleware +
 * any route handlers that opted into the edge runtime. Inert until
 * SENTRY_DSN is set.
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
