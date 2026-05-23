/**
 * Custom HTML template used by Expo Router for the web bundle.
 *
 * Why this exists:
 * 1. Safari iOS shows white bezels in the status-bar + home-indicator
 * safe areas unless we both (a) set viewport-fit=cover so content
 * can extend under those zones and (b) give body a background that
 * matches the app shell instead of the browser's default white.
 * 2. theme-color lets Safari tint its UI chrome (status bar, swipe-up
 * area) to match the app, completing the edge-to-edge look.
 *
 * The mobile app defaults to dark mode (see lib/themeMode.tsx), so the
 * default body bg here is dark. We use prefers-color-scheme as a hint
 * for users who flipped the OS toggle to light — they get the light bg
 * during the brief moment before React mounts and the in-app theme
 * takes over.
 */
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
 return (
 <html lang="en">
 <head>
 <meta charSet="utf-8" />
 <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
 <meta
 name="viewport"
 content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
 />
 {/* Tints Safari's chrome (status bar, swipe area) so they
 blend with the app surface instead of flashing white. */}
 <meta
 name="theme-color"
 content="#050505"
 media="(prefers-color-scheme: dark)"
 />
 <meta
 name="theme-color"
 content="#FAFAF7"
 media="(prefers-color-scheme: light)"
 />
 {/* Tells iOS to render the app full-screen when added to the
 home screen, including under the status bar. */}
 <meta name="apple-mobile-web-app-capable" content="yes" />
 <meta
 name="apple-mobile-web-app-status-bar-style"
 content="black-translucent"
 />
 <ScrollViewStyleReset />
 <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
 </head>
 <body>{children}</body>
 </html>
 );
}

// Body bg matches the default (dark) palette. Light-mode users see
// the light bg only via prefers-color-scheme until React boots.
const responsiveBackground = `
 html, body { background-color: #050505; }
 @media (prefers-color-scheme: light) {
 html, body { background-color: #FAFAF7; }
 }
`;
