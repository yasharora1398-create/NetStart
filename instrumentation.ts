/**
 * Next.js instrumentation hook. Picked up automatically when the
 * `experimental.instrumentationHook` (now default in Next 15) is on.
 * Routes to the right Sentry config based on which runtime is
 * starting up.
 */
export async function register() {
 if (process.env.NEXT_RUNTIME === "nodejs") {
 await import("./sentry.server.config");
 }
 if (process.env.NEXT_RUNTIME === "edge") {
 await import("./sentry.edge.config");
 }
}

export { onRequestError } from "@sentry/nextjs";
