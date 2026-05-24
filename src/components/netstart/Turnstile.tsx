"use client";
/**
 * Cloudflare Turnstile widget wrapper.
 *
 * Renders Cloudflare's CAPTCHA in the signup form. In "Managed" mode
 * (which we configured the widget for) Cloudflare decides whether to
 * challenge - bots get a real puzzle, most humans pass invisibly.
 *
 * Mechanics:
 * - The first <Turnstile> on the page injects Cloudflare's loader
 * script. Subsequent mounts reuse the already-loaded global.
 * - We call turnstile.render() once on mount, pass the resulting
 * widget id into a ref so we can reset() it after a failed
 * submit (Turnstile tokens are single-use; resubmitting without
 * a fresh token always fails on Supabase's side).
 * - On token issued -> onVerify(token). Token is then handed to
 * supabase.auth.signUp({ options: { captchaToken } }).
 *
 * If the site key env var is missing (local dev without the var, or
 * a misconfigured deploy), we render nothing and warn once in the
 * console - the form falls back to no-CAPTCHA, which Supabase will
 * reject only if "Enable CAPTCHA protection" is also on in Supabase.
 */
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

declare global {
 interface Window {
 turnstile?: {
 render: (
 container: string | HTMLElement,
 options: {
 sitekey: string;
 callback?: (token: string) => void;
 "error-callback"?: () => void;
 "expired-callback"?: () => void;
 theme?: "light" | "dark" | "auto";
 size?: "normal" | "compact";
 appearance?: "always" | "execute" | "interaction-only";
 },
 ) => string;
 reset: (widgetId?: string) => void;
 remove: (widgetId?: string) => void;
 };
 }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const SCRIPT_ID = "cf-turnstile-script";

let warnedMissingKey = false;

const ensureScript = (): Promise<void> => {
 if (typeof window === "undefined") return Promise.resolve();
 if (window.turnstile) return Promise.resolve();
 const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
 if (existing) {
 return new Promise((resolve) => {
 const check = () => {
 if (window.turnstile) resolve();
 else setTimeout(check, 50);
 };
 check();
 });
 }
 return new Promise((resolve) => {
 const s = document.createElement("script");
 s.id = SCRIPT_ID;
 s.src = SCRIPT_SRC;
 s.async = true;
 s.defer = true;
 s.onload = () => resolve();
 document.head.appendChild(s);
 });
};

type Props = {
 onVerify: (token: string) => void;
 onExpire?: () => void;
 onError?: () => void;
 /** Force a particular visual theme. Default tracks the user's
 * existing site theme via Tailwind's dark class. */
 theme?: "light" | "dark" | "auto";
};

// Cloudflare's "Managed" Turnstile widget renders at 300x65 px. We
// reserve the same footprint with a skeleton so the form doesn't
// reflow when the script finishes loading + the real widget swaps in.
const WIDGET_WIDTH = 300;
const WIDGET_HEIGHT = 65;

export const Turnstile = ({
 onVerify,
 onExpire,
 onError,
 theme = "auto",
}: Props) => {
 const containerRef = useRef<HTMLDivElement | null>(null);
 const widgetIdRef = useRef<string | null>(null);
 // Flips to true the moment turnstile.render() resolves so we can
 // hide the skeleton overlay. Until then the user sees a static
 // "Verifying..." placeholder that occupies the widget's footprint.
 const [widgetReady, setWidgetReady] = useState(false);

 useEffect(() => {
 const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
 if (!siteKey) {
 if (!warnedMissingKey) {
 console.warn(
 "[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset. " +
 "CAPTCHA widget will not render. Add the env var in " +
 "Vercel and (locally) in .env.local.",
 );
 warnedMissingKey = true;
 }
 return;
 }

 let mounted = true;
 void ensureScript().then(() => {
 if (!mounted) return;
 if (!containerRef.current) return;
 if (!window.turnstile) return;
 // Bail if the container already hosts a widget (e.g. effect
 // re-ran from a hot reload or strict-mode double-invoke).
 if (widgetIdRef.current) return;
 widgetIdRef.current = window.turnstile.render(containerRef.current, {
 sitekey: siteKey,
 callback: (token: string) => onVerify(token),
 "expired-callback": () => onExpire?.(),
 "error-callback": () => onError?.(),
 theme,
 });
 // Brief delay so the widget DOM has visibly populated before
 // we drop the skeleton -- otherwise there's a 1-frame gap.
 window.setTimeout(() => {
 if (mounted) setWidgetReady(true);
 }, 80);
 });

 return () => {
 mounted = false;
 if (widgetIdRef.current && window.turnstile) {
 try {
 window.turnstile.remove(widgetIdRef.current);
 } catch {
 // ignore - remove() throws if the widget is already gone
 }
 widgetIdRef.current = null;
 }
 };
 // onVerify/onExpire/onError intentionally not in deps: we render
 // the widget exactly once per mount. Parent re-renders that
 // change handler identity should not trigger a widget reset.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 // Outer wrapper holds the reserved space; the skeleton overlay
 // sits on top until widgetReady flips. The Turnstile script
 // injects an <iframe> into containerRef.current; that iframe
 // becomes visible as soon as we hide the skeleton on top of it.
 return (
 <div
 className="relative"
 style={{ width: WIDGET_WIDTH, height: WIDGET_HEIGHT }}
 >
 <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
 {!widgetReady && (
 <div
 aria-hidden
 className="absolute inset-0 flex items-center justify-center gap-2 rounded-md border border-border bg-card text-xs text-muted-foreground"
 >
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 <span>Checking you're human...</span>
 </div>
 )}
 </div>
 );
};
