import type { NextConfig } from "next";

/**
 * Next.js config. Replaces vite.config.ts.
 *
 * Routing rules previously in vercel.json:
 *   - Mobile UA on any non-/m/ path -> /m/ (the Expo web bundle)
 *   - Desktop UA on /m/* -> / (back to the React site)
 * are reproduced here as `redirects()` so Vercel does the same thing
 * whether we're running Next dev locally or in prod.
 *
 * Next.js owns its own SPA fallback now -- the old `/(.*) -> /index.html`
 * rewrite in vercel.json is no longer needed (and is removed from
 * vercel.json so it stops fighting the App Router).
 *
 * The Expo mobile bundle still lives under public/m/* in the same
 * output, so Next serves it statically with no extra wiring.
 */
const config: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  // Inline the same TS error tolerance the Vite project ran with so
  // existing files (which were never strict-typed) don't block the build.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // The Expo mobile bundle in public/m/ is a single-page app: every
  // URL under /m/* needs to serve /m/index.html so the in-bundle
  // Expo Router can take over and resolve the deep link client-side.
  // Without this, a request to /m/ (or /m/match, /m/chats, etc.)
  // hits Next.js's static handler which doesn't auto-serve a
  // directory's index.html and 404s. This rewrite was previously
  // declared in vercel.json under the Vite setup; ported here so
  // Next.js can keep the same behavior.
  async rewrites() {
    return [
      { source: "/m", destination: "/m/index.html" },
      { source: "/m/", destination: "/m/index.html" },
      // Inner SPA routes (everything after /m/) also funnel into the
      // single index.html. Static asset paths (_expo/, assets/) are
      // matched against the filesystem first by Next.js, so this
      // catch-all only catches the SPA-routed URLs.
      { source: "/m/:path*", destination: "/m/index.html" },
    ];
  },

  async redirects() {
    return [
      // Phone-shaped UAs hitting the main site get pushed into /m/
      // (the Expo web bundle). The negative lookahead keeps static
      // assets, the Expo bundle itself, favicons, robots, and sitemap
      // from being redirected.
      {
        source:
          "/((?!m/|m$|_expo/|_next/|assets/|favicon|robots\\.txt|sitemap\\.xml|polln8-|apple-touch-icon|site\\.webmanifest).*)",
        has: [
          {
            type: "header",
            key: "user-agent",
            value: "(?i).*(Mobi|Android|iPhone|iPad|iPod).*",
          },
        ],
        destination: "/m/",
        permanent: false,
      },
      // Desktop UAs poking at /m/* get sent home so they don't load
      // the mobile bundle on a laptop.
      {
        source: "/m/:path*",
        missing: [
          {
            type: "header",
            key: "user-agent",
            value: "(?i).*(Mobi|Android|iPhone|iPad|iPod).*",
          },
        ],
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default config;
