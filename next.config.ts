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
