import { useEffect, useRef, useState } from "react";
import treeSrc from "@/assets/netstart-tree-486b9b.png";
import textSrc from "@/assets/netstart-text-only.png";
import { assetUrl } from "@/lib/asset-url";

const DURATION = 3.0;

const BRAND_BLUE = "#486b9b";
const BRAND_BLUE_DEEP = "#2f4a75";
const BRAND_BLUE_LIGHT = "#7fa4d0";
const MUTED = "rgba(255,255,255,0.72)";

const LOGO_DISPLAY_W = 920;
const LOGO_RATIO = 261 / 1432;
const LOGO_DISPLAY_H = LOGO_DISPLAY_W * LOGO_RATIO;

const TREE_W = LOGO_DISPLAY_W * 0.135;
const TREE_H = LOGO_DISPLAY_H * 0.739;
const TREE_X = LOGO_DISPLAY_W * 0.628;
const TREE_Y = LOGO_DISPLAY_H * 0.180;
const TREE_CENTER_X = TREE_X + TREE_W / 2;

const CANVAS_W = 1080;
const CANVAS_H = 1920;

const Easing = {
 easeInCubic: (t: number) => t * t * t,
 easeOutCubic: (t: number) => {
 const u = t - 1;
 return u * u * u + 1;
 },
 easeInOutCubic: (t: number) =>
 t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
 easeOutBack: (t: number) => {
 const c1 = 1.70158;
 const c3 = c1 + 1;
 return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
 },
};

type Ease = (t: number) => number;

const animate =
 ({ from = 0, to = 1, start = 0, end = 1, ease = Easing.easeInOutCubic }: {
 from?: number;
 to?: number;
 start?: number;
 end?: number;
 ease?: Ease;
 }) =>
 (t: number) => {
 if (t <= start) return from;
 if (t >= end) return to;
 const local = (t - start) / (end - start);
 return from + (to - from) * ease(local);
 };

const hexToRgb = (hex: string) => {
 const h = hex.replace("#", "");
 const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
 return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const parseColor = (c: string) => {
 if (c.startsWith("#")) {
 const { r, g, b } = hexToRgb(c);
 return { r, g, b, a: 1 };
 }
 const m = c.match(/rgba?\(([^)]+)\)/);
 if (!m) return { r: 255, g: 255, b: 255, a: 1 };
 const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
 return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts[3] ?? 1 };
};
const lerpColor = (a: string, b: string, t: number) => {
 const ca = parseColor(a);
 const cb = parseColor(b);
 const r = Math.round(ca.r + (cb.r - ca.r) * t);
 const g = Math.round(ca.g + (cb.g - ca.g) * t);
 const bl = Math.round(ca.b + (cb.b - ca.b) * t);
 const al = ca.a + (cb.a - ca.a) * t;
 return `rgba(${r}, ${g}, ${bl}, ${al})`;
};

const FullBleedBackground = () => (
 <div
 style={{
 position: "fixed",
 inset: 0,
 background: "#000",
 overflow: "hidden",
 zIndex: 0,
 }}
 >
 <div
 style={{
 position: "absolute",
 inset: 0,
 background:
 "radial-gradient(ellipse 120% 90% at 30% 70%, #1a1d24 0%, #0d0f14 45%, #000 80%)",
 opacity: 0.9,
 }}
 />
 <div
 style={{
 position: "absolute",
 left: "50%",
 top: "50%",
 width: "160vmin",
 height: "160vmin",
 transform: "translate(-50%, -50%)",
 borderRadius: "50%",
 background:
 "radial-gradient(circle, transparent 34%, rgba(40,46,58,0.45) 35%, transparent 36%, transparent 52%, rgba(30,34,44,0.4) 53%, transparent 54%, transparent 72%, rgba(24,28,36,0.35) 73%, transparent 74%)",
 opacity: 0.6,
 filter: "none",
 }}
 />
 <div
 style={{
 position: "absolute",
 left: "78%",
 top: "18%",
 width: "90vmin",
 height: "90vmin",
 transform: "translate(-50%, -50%)",
 background: `radial-gradient(circle, ${BRAND_BLUE} 0%, ${BRAND_BLUE_DEEP} 22%, rgba(20,40,110,0.4) 50%, rgba(0,0,0,0) 72%)`,
 filter: "none",
 opacity: 0.55,
 }}
 />
 <div
 style={{
 position: "absolute",
 left: "10%",
 top: "82%",
 width: "55vmin",
 height: "55vmin",
 transform: "translate(-50%, -50%)",
 background:
 "radial-gradient(circle, rgba(72,107,155,0.5) 0%, rgba(47,74,117,0.2) 45%, rgba(0,0,0,0) 72%)",
 filter: "none",
 opacity: 0.55,
 }}
 />
 <div
 style={{
 position: "absolute",
 inset: 0,
 background:
 "radial-gradient(1px 1px at 20% 15%, rgba(255,255,255,0.45), transparent 60%), radial-gradient(1px 1px at 75% 22%, rgba(255,255,255,0.3), transparent 60%), radial-gradient(1px 1px at 40% 8%, rgba(255,255,255,0.28), transparent 60%), radial-gradient(1px 1px at 88% 40%, rgba(255,255,255,0.22), transparent 60%), radial-gradient(1px 1px at 12% 55%, rgba(255,255,255,0.28), transparent 60%), radial-gradient(1px 1px at 65% 72%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(1px 1px at 30% 90%, rgba(255,255,255,0.22), transparent 60%), radial-gradient(1px 1px at 82% 88%, rgba(255,255,255,0.2), transparent 60%)",
 opacity: 0.8,
 }}
 />
 <div
 style={{
 position: "absolute",
 inset: 0,
 background:
 "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
 pointerEvents: "none",
 }}
 />
 </div>
);

const LogoLockup = ({ t }: { t: number }) => {
 const treeIn = animate({ from: 0, to: 1, start: 0.0, end: 0.45, ease: Easing.easeOutBack })(t);
 const treeOpacity = animate({ from: 0, to: 1, start: 0.0, end: 0.35, ease: Easing.easeOutCubic })(t);

 const move = animate({ from: 0, to: 1, start: 0.9, end: 1.55, ease: Easing.easeInOutCubic })(t);

 const BIG_TREE_SIZE = 460;
 const currentTreeW = BIG_TREE_SIZE + (TREE_W - BIG_TREE_SIZE) * move;
 const currentTreeH = BIG_TREE_SIZE + (TREE_H - BIG_TREE_SIZE) * move;
 const treeEntryScale = 0.25 + 0.75 * treeIn;

 const pulsePhase = Math.sin(t * 5) * 0.5 + 0.5;
 const glowEnvelope = animate({ from: 0, to: 1, start: 0.1, end: 0.6, ease: Easing.easeOutCubic })(t);
 const glowDecay = 1 - animate({ from: 0, to: 1, start: 1.55, end: 2.2, ease: Easing.easeOutCubic })(t);
 const glowAmt = glowEnvelope * (0.4 + 0.6 * glowDecay) + 0.2 * pulsePhase * glowDecay;

 const textReveal = animate({ from: 0, to: 1, start: 1.35, end: 2.0, ease: Easing.easeOutCubic })(t);
 const textOpacity = animate({ from: 0, to: 1, start: 1.35, end: 1.75, ease: Easing.easeOutCubic })(t);
 const leftInset = TREE_CENTER_X * (1 - textReveal);
 const rightInset = (LOGO_DISPLAY_W - TREE_CENTER_X) * (1 - textReveal);
 const clip = `inset(0px ${rightInset}px 0px ${leftInset}px)`;

 const drift = Math.sin((t - 2.1) * 0.9) * (t > 2.1 ? 4 : 0);

 const exit = animate({ from: 0, to: 1, start: 2.75, end: 3.0, ease: Easing.easeInCubic })(t);
 const groupOpacity = 1 - exit;

 const bigCenterX = CANVAS_W / 2;
 const bigCenterY = CANVAS_H / 2;
 const finalCenterX = CANVAS_W / 2 - LOGO_DISPLAY_W / 2 + TREE_X + TREE_W / 2;
 const finalCenterY = CANVAS_H * 0.42 - LOGO_DISPLAY_H / 2 + TREE_Y + TREE_H / 2;
 const treeCenterX = bigCenterX + (finalCenterX - bigCenterX) * move;
 const treeCenterY = bigCenterY + (finalCenterY - bigCenterY) * move;

 return (
 <>
 <div
 style={{
 position: "absolute",
 left: treeCenterX,
 top: treeCenterY,
 width: currentTreeW,
 height: currentTreeH,
 transform: `translate(-50%, -50%) scale(${treeEntryScale})`,
 transformOrigin: "center",
 opacity: treeOpacity * groupOpacity,
 filter: `(0 0 ${60 * glowAmt}px rgba(72,107,155,${0.9 * glowAmt})) (0 0 ${22 * glowAmt}px rgba(127,164,208,${0.8 * glowAmt}))`,
 willChange: "transform, opacity, filter, left, top, width, height",
 zIndex: 2,
 }}
 >
 <img
 src={assetUrl(treeSrc)}
 alt=""
 style={{ width: "100%", height: "100%", display: "block" }}
 />
 </div>

 <div
 style={{
 position: "absolute",
 left: "50%",
 top: "42%",
 transform: `translate(-50%, calc(-50% + ${drift}px))`,
 opacity: groupOpacity,
 zIndex: 1,
 }}
 >
 <div
 style={{
 position: "relative",
 width: LOGO_DISPLAY_W,
 height: LOGO_DISPLAY_H,
 }}
 >
 <div
 style={{
 position: "absolute",
 inset: 0,
 width: LOGO_DISPLAY_W,
 height: LOGO_DISPLAY_H,
 clipPath: clip,
 WebkitClipPath: clip,
 opacity: textOpacity,
 willChange: "clip-path, opacity",
 }}
 >
 <img
 src={assetUrl(textSrc)}
 alt="NetStart"
 style={{ width: "100%", height: "100%", display: "block" }}
 />
 </div>
 </div>
 </div>
 </>
 );
};

const Tagline = ({ t }: { t: number }) => {
 const words = ["Find", "people", "who", "can", "actually", "build."];
 const startBase = 1.75;
 const stagger = 0.1;
 const perWord = 0.42;

 const exit = animate({ from: 0, to: 1, start: 2.75, end: 3.0, ease: Easing.easeInCubic })(t);
 const groupOpacity = 1 - exit;

 return (
 <div
 style={{
 position: "absolute",
 left: "50%",
 top: "55%",
 transform: "translate(-50%, 0)",
 width: "86%",
 display: "flex",
 flexWrap: "wrap",
 justifyContent: "center",
 alignItems: "baseline",
 gap: "0 22px",
 fontFamily: "'Playfair Display', Georgia, serif",
 fontWeight: 500,
 fontSize: 68,
 letterSpacing: "-0.01em",
 lineHeight: 1.15,
 textAlign: "center",
 color: MUTED,
 opacity: groupOpacity,
 }}
 >
 {words.map((w, i) => {
 const start = startBase + i * stagger;
 const end = start + perWord;
 const p = animate({ from: 0, to: 1, start, end, ease: Easing.easeInCubic })(t);
 const = (1 - p) * 14;
 const ty = (1 - p) * 10;
 const highlight = w === "actually";
 const color = highlight
 ? lerpColor("rgba(255,255,255,0.72)", BRAND_BLUE_LIGHT, Math.max(0, p))
 : "inherit";
 return (
 <span
 key={i}
 style={{
 display: "inline-block",
 opacity: p,
 filter: `(${}px)`,
 transform: `translateY(${ty}px)`,
 color,
 willChange: "filter, transform, opacity",
 }}
 >
 {w}
 </span>
 );
 })}
 </div>
 );
};

interface IntroOverlayProps {
 onDone: () => void;
}

export const IntroOverlay = ({ onDone }: IntroOverlayProps) => {
 const [t, setT] = useState(0);
 const [hiding, setHiding] = useState(false);
 const [scale, setScale] = useState(1);
 const onDoneRef = useRef(onDone);
 onDoneRef.current = onDone;

 useEffect(() => {
 const update = () => {
 const s = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
 setScale(s);
 };
 update();
 window.addEventListener("resize", update);
 return () => window.removeEventListener("resize", update);
 }, []);

 useEffect(() => {
 const startTime = performance.now();
 let raf = 0;
 const tick = (now: number) => {
 const elapsed = (now - startTime) / 1000;
 if (elapsed >= DURATION) {
 setT(DURATION);
 setHiding(true);
 window.setTimeout(() => onDoneRef.current(), 220);
 return;
 }
 setT(elapsed);
 raf = requestAnimationFrame(tick);
 };
 raf = requestAnimationFrame(tick);
 return () => cancelAnimationFrame(raf);
 }, []);

 const skip = () => {
 setT(DURATION);
 setHiding(true);
 window.setTimeout(() => onDoneRef.current(), 220);
 };

 return (
 <div
 onClick={skip}
 style={{
 position: "fixed",
 inset: 0,
 zIndex: 9999,
 opacity: hiding ? 0 : 1,
 transition: "opacity 220ms ease-out",
 cursor: "pointer",
 }}
 >
 <FullBleedBackground />
 <div
 style={{
 position: "absolute",
 inset: 0,
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 zIndex: 1,
 }}
 >
 <div
 style={{
 width: CANVAS_W,
 height: CANVAS_H,
 position: "relative",
 transform: `scale(${scale})`,
 transformOrigin: "center center",
 flexShrink: 0,
 }}
 >
 <LogoLockup t={t} />
 <Tagline t={t} />
 </div>
 </div>
 </div>
 );
};
