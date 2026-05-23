/**
 * Sets per-route document.title + meta description (+ canonical) so
 * Google indexes each page with its own SEO targeting and the
 * browser tab shows something useful as the user navigates.
 *
 * Vite + React Router renders a single index.html with default tags,
 * so without this every page would share the homepage title. We
 * also patch the OG title/description while we're at it so social
 * shares of deep links (e.g. /how) get the right preview.
 *
 * Usage:
 *   usePageMeta({
 *     title: "How Polln8 Works",
 *     description: "Polln8 verifies partners, ranks them...",
 *     path: "/how",
 *   });
 */
import { useEffect } from "react";

type Args = {
  /** Full <title> tag value. Keep under ~60 chars to avoid SERP truncation. */
  title: string;
  /** <meta name="description">. Keep under ~160 chars. */
  description: string;
  /**
   * Path the page lives at, used for the canonical link. We always
   * canonicalize to the bare polln8.com domain so the apex and any
   * www / vercel.app variants don't compete for the same content.
   */
  path: string;
};

const ORIGIN = "https://polln8.com";

/** Find an existing <meta> by name|property; create + append if missing. */
const upsertMeta = (
  attr: "name" | "property",
  key: string,
  content: string,
): void => {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertCanonical = (href: string): void => {
  let el = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

export const usePageMeta = ({ title, description, path }: Args): void => {
  useEffect(() => {
    document.title = title;
    upsertMeta("name", "description", description);

    // Canonicalise. Strip trailing slash on non-root paths to keep
    // the URL set tight and avoid duplicate-content signals.
    const cleaned =
      path === "/" ? "/" : path.replace(/\/+$/, "") || "/";
    upsertCanonical(`${ORIGIN}${cleaned}`);

    // Mirror title + description into Open Graph + Twitter so
    // social previews of deep links don't fall back to the
    // homepage copy.
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", `${ORIGIN}${cleaned}`);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
  }, [title, description, path]);
};
