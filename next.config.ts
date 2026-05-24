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
      // Expo's web export hard-codes the bundle path as
      // `<script src="/_expo/static/js/web/entry-X.js">` but the
      // file actually lives at public/m/_expo/.... Next.js's static
      // handler looks in public/ at the root and 404s. This rewrite
      // maps the absolute path back into /m/ so the bundle is
      // served and the React Native app actually mounts.
      // (Asset images use /assets/node_modules/... which is already
      // excluded by the desktop->/m/ redirect rule and the file
      // resolution catches them under public/m/assets/.)
      { source: "/_expo/:path*", destination: "/m/_expo/:path*" },
      // Inner SPA routes (everything after /m/) funnel into the
      // single index.html. Static asset paths (_expo/, assets/) are
      // matched against the filesystem first by Next.js, so this
      // catch-all only catches the SPA-routed URLs.
      { source: "/m/:path*", destination: "/m/index.html" },
    ];
  },

  async redirects() {
    const phoneUA = ".*(Mobi|Android|iPhone|iPad|iPod).*";
    return [
      // Desktop UAs poking at /m/* get sent home so they don't load
      // the mobile bundle on a laptop.
      {
        source: "/m/:path*",
        missing: [
          {
            type: "header",
            key: "user-agent",
            value: phoneUA,
          },
        ],
        destination: "/",
        permanent: false,
      },

      // Phone UAs hitting the signed-in web app pages (match / saved /
      // chats / mynet / applications) get bounced to the Expo mobile
      // bundle, which is the real phone experience for those screens.
      // `/` itself is NOT in this list: it renders MobileHome (the
      // mobile marketing page) for first-time phone visitors. Marketing
      // + auth pages (/how, /standards, /signin, /signup, etc.) also
      // stay on web so the sign-up flow keeps working in a phone
      // browser.
      {
        source: "/match",
        has: [{ type: "header", key: "user-agent", value: phoneUA }],
        destination: "/m/",
        permanent: false,
      },
      {
        source: "/saved",
        has: [{ type: "header", key: "user-agent", value: phoneUA }],
        destination: "/m/saved",
        permanent: false,
      },
      {
        source: "/chats",
        has: [{ type: "header", key: "user-agent", value: phoneUA }],
        destination: "/m/threads",
        permanent: false,
      },
      {
        source: "/chats/:id",
        has: [{ type: "header", key: "user-agent", value: phoneUA }],
        destination: "/m/chat/:id",
        permanent: false,
      },
      {
        source: "/mynet",
        has: [{ type: "header", key: "user-agent", value: phoneUA }],
        destination: "/m/mynet",
        permanent: false,
      },
      {
        source: "/applications",
        has: [{ type: "header", key: "user-agent", value: phoneUA }],
        destination: "/m/applications",
        permanent: false,
      },
      {
        source: "/settings",
        has: [{ type: "header", key: "user-agent", value: phoneUA }],
        destination: "/m/settings",
        permanent: false,
      },
      {
        source: "/u/:id",
        has: [{ type: "header", key: "user-agent", value: phoneUA }],
        destination: "/m/u/:id",
        permanent: false,
      },
    ];
  },
};

export default config;
