/**
 * Root layout for the entire site. Replaces the old index.html.
 *
 * This file is a React Server Component -- it runs at build time on
 * Vercel and renders the outer HTML shell, including <head> meta,
 * favicons, JSON-LD structured data, theme-color, etc. Once the
 * rendered HTML lands in the browser, Providers (client component)
 * takes over for routing/auth/state.
 *
 * Why everything that used to be inline JS in index.html lives here:
 * - Next.js owns <html> and <head>. Editing them outside this file
 * produces hydration warnings.
 * - The pre-React theme-detection script (which sets the .dark
 * class before paint so we don't flash light-mode) is preserved
 * via the `<Script strategy="beforeInteractive">` slot.
 * - All meta tags / og: / twitter: / robots / canonical that lived
 * in index.html now live in the exported `metadata` object below
 * and are emitted by Next.
 * - The Plausible analytics script keeps deferred-loading via a
 * <Script strategy="afterInteractive"> entry near the end.
 */
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@/index.css";
import Providers from "./providers";

const SITE_URL = "https://polln8.com";
const SITE_TITLE = "Polln8 | Where cofounders find each other";
const SITE_DESCRIPTION =
 "Cofounders found efficiently. Polln8 matches certified founders and partners through a quality, skill discovery platform built to accelerate early-stage startups.";
const OG_IMAGE = `${SITE_URL}/polln8-og.png`;

// This app is heavily client-side (auth, real-time chat, swipe deck,
// hover-driven marketing animations) and every route already mounts
// the same Providers tree. Pre-rendering an empty shell at build
// time just adds complexity and trips up hooks like useSearchParams
// that need a Suspense boundary in static contexts. So we opt the
// whole tree out of static rendering -- Vercel will still cache the
// rendered HTML at the edge per request, which is what we want.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
 metadataBase: new URL(SITE_URL),
 title: {
 default: SITE_TITLE,
 template: "%s | Polln8",
 },
 description: SITE_DESCRIPTION,
 applicationName: "Polln8",
 authors: [{ name: "Polln8" }],
 generator: "Next.js",
 keywords: [
 "how to find a cofounder",
 "how to find a technical cofounder",
 "where to find a cofounder",
 "find a cofounder online",
 "looking for a technical cofounder",
 "find a cto for my startup",
 "find a non-technical cofounder",
 "how to join a startup",
 "join a startup as a cofounder",
 "early employee startup jobs",
 "startup jobs equity",
 "become a startup cofounder",
 "polln8",
 ],
 referrer: "strict-origin-when-cross-origin",
 formatDetection: { telephone: false },
 alternates: { canonical: SITE_URL },
 robots: {
 index: true,
 follow: true,
 googleBot: {
 index: true,
 follow: true,
 "max-image-preview": "large",
 "max-snippet": -1,
 "max-video-preview": -1,
 },
 },
 openGraph: {
 type: "website",
 siteName: "Polln8",
 title: SITE_TITLE,
 description: SITE_DESCRIPTION,
 url: SITE_URL,
 locale: "en_US",
 images: [
 {
 url: OG_IMAGE,
 secureUrl: OG_IMAGE,
 type: "image/png",
 width: 1200,
 height: 630,
 alt: "Polln8 | Where cofounders find each other",
 },
 ],
 },
 twitter: {
 card: "summary_large_image",
 title: SITE_TITLE,
 description: SITE_DESCRIPTION,
 images: [{ url: OG_IMAGE, alt: SITE_TITLE }],
 },
 // ?v=2 cache-bust appended to every icon URL so Google fetches the
 // current Polln8 favicon instead of the stale one its index cached
 // from the previous (Vite/Lovable) deployment. Bump the version
 // (?v=3, v=4) the next time you change the logo file.
 icons: {
 icon: [
 { url: "/favicon.ico?v=2", sizes: "any" },
 { url: "/polln8-logo.png?v=2", type: "image/png", sizes: "32x32" },
 { url: "/polln8-logo.png?v=2", type: "image/png", sizes: "192x192" },
 { url: "/polln8-logo.png?v=2", type: "image/png", sizes: "512x512" },
 ],
 apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180" }],
 other: [{ rel: "mask-icon", url: "/polln8-logo.png?v=2", color: "#050505" }],
 },
 manifest: "/site.webmanifest",
 appleWebApp: {
 capable: true,
 title: "Polln8",
 statusBarStyle: "black-translucent",
 },
};

export const viewport: Viewport = {
 width: "device-width",
 initialScale: 1,
 viewportFit: "cover",
 // Default to the light surface; the boot-theme inline script
 // overrides this to #050505 when a dark preference is saved.
 themeColor: "#FAFAF7",
};

// JSON-LD blobs preserved verbatim from index.html so search engines
// see the same Organization / WebSite / FAQ schema we were emitting
// under Vite.
const ORG_LD = {
 "@context": "https://schema.org",
 "@type": "Organization",
 name: "Polln8",
 url: SITE_URL,
 logo: `${SITE_URL}/polln8-logo.png`,
 description: SITE_DESCRIPTION,
 keywords:
 "how to find a cofounder, how to find a technical cofounder, where to find a cofounder, find a cofounder online, looking for a technical cofounder, find a cto for my startup, find a non-technical cofounder, how to join a startup, join a startup as a cofounder, early employee startup jobs, startup jobs equity, become a startup cofounder",
 sameAs: [] as string[],
};

const WEBSITE_LD = {
 "@context": "https://schema.org",
 "@type": "WebSite",
 name: "Polln8",
 url: SITE_URL,
};

const FAQ_LD = {
 "@context": "https://schema.org",
 "@type": "FAQPage",
 mainEntity: [
 {
 "@type": "Question",
 name: "How to find a cofounder?",
 acceptedAnswer: {
 "@type": "Answer",
 text:
 "Use Polln8. We're private matchmaking for cofounders: every profile is reviewed by a human, every match is mutual, and most users get their first matches in under 24 hours.",
 },
 },
 {
 "@type": "Question",
 name: "How to find a technical cofounder?",
 acceptedAnswer: {
 "@type": "Answer",
 text:
 "Post what you're building on Polln8. We surface vetted technical partners (engineers, CTOs, founding engineers) whose skills and commitment actually match your project, not a list of names you have to cold-DM.",
 },
 },
 {
 "@type": "Question",
 name: "Where to find a cofounder?",
 acceptedAnswer: {
 "@type": "Answer",
 text:
 "On Polln8. Twitter DMs and YC's cofounder matcher are noisy. Polln8 is a private, vetted network that only shows you people who have been reviewed and who are actively looking.",
 },
 },
 {
 "@type": "Question",
 name: "How to find a cofounder online?",
 acceptedAnswer: {
 "@type": "Answer",
 text:
 "Sign up at polln8.com, tell us who you are, and we review you in under 24 hours. Once you're in you can browse founders and partners, accept the ones who fit, and chat as soon as the other side accepts back.",
 },
 },
 {
 "@type": "Question",
 name: "I'm looking for a technical cofounder. What's the fastest way?",
 acceptedAnswer: {
 "@type": "Answer",
 text:
 "Polln8 is built for this. Post your project once and we route it to vetted technical partners (engineers, CTOs, founding engineers) who are actively looking for a startup to join.",
 },
 },
 {
 "@type": "Question",
 name: "How do I find a CTO for my startup?",
 acceptedAnswer: {
 "@type": "Answer",
 text:
 "Post your project on Polln8. We match founders with partners who are CTO-level and looking for equity-aligned startups to join, not contractors, not freelancers.",
 },
 },
 {
 "@type": "Question",
 name: "How to find a non-technical cofounder?",
 acceptedAnswer: {
 "@type": "Answer",
 text:
 "Polln8 matches both sides. Partners can browse vetted non-technical founders with real go-to-market, sales, design, or operations chops who are looking for a technical partner.",
 },
 },
 {
 "@type": "Question",
 name: "How to join a startup?",
 acceptedAnswer: {
 "@type": "Answer",
 text:
 "On Polln8 you browse the projects vetted founders are actively building. See the stage, the equity they're offering, and exactly what they need, then request to chat. No job-board noise.",
 },
 },
 {
 "@type": "Question",
 name: "Can I join a startup as a cofounder?",
 acceptedAnswer: {
 "@type": "Answer",
 text:
 "Yes. Polln8 is built around cofounder-level joins: you swipe through founders looking for cofounders or founding engineers, with equity terms up front. Mutual interest before any commitment.",
 },
 },
 {
 "@type": "Question",
 name: "Where can I find early employee startup jobs?",
 acceptedAnswer: {
 "@type": "Answer",
 text:
 "Polln8. Every project on Polln8 is a vetted early-stage startup actively looking for cofounder-tier or founding-employee-tier hires, not a 200-person company with an open req.",
 },
 },
 {
 "@type": "Question",
 name: "How do I find startup jobs with equity?",
 acceptedAnswer: {
 "@type": "Answer",
 text:
 "Browse Polln8. Every project lists what equity is on the table up front, so you only chat with founders whose terms you can actually accept.",
 },
 },
 {
 "@type": "Question",
 name: "How do I become a startup cofounder?",
 acceptedAnswer: {
 "@type": "Answer",
 text:
 "Sign up on Polln8 as a partner. We vet your background, surface you to founders whose project fits your skills, and open a chat the moment both sides accept. No DMing strangers, no cold pitches.",
 },
 },
 ],
};

export default function RootLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <html lang="en" suppressHydrationWarning>
 <head>
 {/* Explicit meta tags as defence in depth - Next.js already
 emits these from the metadata export above, but adding
 them inline here makes absolutely sure they exist in the
 served HTML even if anything upstream strips the
 generated ones. Google's snippet selector reads from
 <meta name="description"> first. */}
 <meta name="description" content={SITE_DESCRIPTION} />
 <meta name="title" content={SITE_TITLE} />
 <meta property="og:title" content={SITE_TITLE} />
 <meta property="og:description" content={SITE_DESCRIPTION} />
 <meta property="og:type" content="website" />
 <meta property="og:url" content={SITE_URL} />
 <meta name="twitter:title" content={SITE_TITLE} />
 <meta name="twitter:description" content={SITE_DESCRIPTION} />

 {/* JSON-LD structured data. Three separate blobs so each shows
 up as its own entity in Google's parser instead of a single
 graph (FAQPage especially needs to be standalone to be
 eligible for FAQ rich results). */}
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_LD) }}
 />
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_LD) }}
 />
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
 />
 </head>
 <body>
 {/* Pre-React theme detection. Sets the .dark class on <html>
 and overrides the theme-color meta the moment the document
 parses, so dark-mode users don't see a flash of the light
 palette during boot. Mirrors src/hooks/useTheme.ts. */}
 <Script id="boot-theme" strategy="beforeInteractive">
 {`
 (function () {
 try {
 // One-time migration: every existing user who had
 // "dark" saved gets reset to light. The marker key
 // makes this run exactly once per browser. After
 // this, the toggle still works normally.
 if (!localStorage.getItem("polln8_web_theme_v2")) {
 localStorage.removeItem("polln8_web_theme");
 localStorage.setItem("polln8_web_theme_v2", "1");
 }
 var saved = localStorage.getItem("polln8_web_theme");
 var mode = saved === "light" || saved === "dark" ? saved : "light";
 if (mode === "dark") document.documentElement.classList.add("dark");
 var meta = document.querySelector('meta[name="theme-color"]');
 if (meta) meta.setAttribute("content", mode === "dark" ? "#050505" : "#FAFAF7");
 } catch (e) {}
 })();
 `}
 </Script>

 {/* Fallback content for the rare crawler that doesn't run
 JavaScript. Intentionally avoids the literal phrase
 "JavaScript" anywhere - Google's older indexer was
 grabbing the legacy CRA "You need to enable JavaScript to
 run this app" string as the page description, and we
 don't want a re-crawl to grab a new copy of that wording
 from our own fallback. */}
 <noscript>
 <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "48px auto", padding: 24 }}>
 <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
 Polln8 - Cofounders found efficiently.
 </h1>
 <p style={{ fontSize: 16, lineHeight: 1.5, color: "#444" }}>
 Polln8 is a private network of vetted founders and
 technical partners. Every profile is reviewed by a
 human, every chat starts with mutual interest, and the
 deck is ranked against what you actually want to build.
 </p>
 <p style={{ fontSize: 14, marginTop: 16, color: "#666" }}>
 Open Polln8 in any modern browser to see the full
 experience.
 </p>
 </div>
 </noscript>

 <Providers>{children}</Providers>

 {/* Plausible analytics. No cookies, no cross-site tracking. */}
 <Script
 defer
 data-domain="polln8.com"
 src="https://plausible.io/js/script.js"
 strategy="afterInteractive"
 />
 </body>
 </html>
 );
}
