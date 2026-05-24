/**
 * Mobile swipe-card wrapper. Renders one card the user can drag
 * left or right; past the threshold the card flies off-screen and
 * the corresponding callback fires. No animation deps " pointer
 * events + CSS transforms.
 *
 * Visual model mirrors the Expo Match deck (`mobile/app/(tabs)/
 * index.tsx`): a stacked under-card peeks behind the top card,
 * and Save / Pass pills fade in on either edge as the user drags.
 */
import {
 useCallback,
 useEffect,
 useRef,
 useState,
 type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type Props = {
 top: ReactNode;
 under?: ReactNode;
 onSwipeLeft: () => void;
 onSwipeRight: () => void;
 /** Key changes when the deck advances; resets the gesture state. */
 resetKey: string;
};

const SWIPE_FRACTION = 0.28;
const FLY_DISTANCE = 1.4;
const FLY_DURATION_MS = 220;

export const MobileSwipeCard = ({
 top,
 under,
 onSwipeLeft,
 onSwipeRight,
 resetKey,
}: Props) => {
 const wrapperRef = useRef<HTMLDivElement | null>(null);
 const startRef = useRef<{ x: number; pointerId: number } | null>(null);
 const widthRef = useRef<number>(0);
 const [tx, setTx] = useState(0);
 const [dragging, setDragging] = useState(false);
 const [flying, setFlying] = useState<"left" | "right" | null>(null);

 useEffect(() => {
 setTx(0);
 setFlying(null);
 }, [resetKey]);

 useEffect(() => {
 const el = wrapperRef.current;
 if (!el) return;
 widthRef.current = el.getBoundingClientRect().width || 1;
 }, [top]);

 const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
 if (flying) return;
 startRef.current = { x: e.clientX, pointerId: e.pointerId };
 (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
 setDragging(true);
 };

 const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
 if (!startRef.current || flying) return;
 if (e.pointerId !== startRef.current.pointerId) return;
 setTx(e.clientX - startRef.current.x);
 };

 const release = useCallback(
 (dir: "left" | "right" | null) => {
 if (!dir) {
 setTx(0);
 setDragging(false);
 return;
 }
 const w = widthRef.current || 1;
 setFlying(dir);
 setDragging(false);
 setTx(dir === "right" ? w * FLY_DISTANCE : -w * FLY_DISTANCE);
 window.setTimeout(() => {
 if (dir === "right") onSwipeRight();
 else onSwipeLeft();
 // Reset the card to centre. For swipe-right (accept) the
 // parent keeps the same project on screen behind the info
 // sheet, so without this the card would stay flown off.
 // For swipe-left the parent advances and the resetKey
 // useEffect would have done this anyway " harmless.
 setTx(0);
 setFlying(null);
 }, FLY_DURATION_MS);
 },
 [onSwipeLeft, onSwipeRight],
 );

 const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
 if (!startRef.current) return;
 if (e.pointerId !== startRef.current.pointerId) return;
 const w = widthRef.current || 1;
 const threshold = w * SWIPE_FRACTION;
 const dir = tx > threshold ? "right" : tx < -threshold ? "left" : null;
 startRef.current = null;
 release(dir);
 };

 const w = widthRef.current || 1;
 const rotate = (tx / w) * 12;
 const opacityRight = Math.min(1, Math.max(0, tx / (w * SWIPE_FRACTION)));
 const opacityLeft = Math.min(1, Math.max(0, -tx / (w * SWIPE_FRACTION)));

 // Direction + intensity drive a colored ring + halo around the
 // card instead of Save/Pass text labels. Right swipe = primary
 // green (accept), left swipe = destructive red (pass). Intensity
 // is whichever direction is currently winning.
 const intensity = Math.max(opacityRight, opacityLeft);
 const swipeColor = opacityRight >= opacityLeft
 ? "var(--primary)"
 : "var(--destructive)";
 // Outer ring grows from 0 to 6px as the user crosses the swipe
 // threshold, plus a soft halo that scales with intensity. Both
 // hsl() calls inline so we can multiply alpha against intensity.
 const ringWidth = (intensity * 6).toFixed(2);
 const haloAlpha = (intensity * 0.55).toFixed(3);
 const boxShadow = intensity > 0
 ? `0 0 0 ${ringWidth}px hsl(${swipeColor}), 0 0 44px 10px hsl(${swipeColor} / ${haloAlpha})`
 : "none";

 return (
 <div ref={wrapperRef} className="relative w-full">
 {under ? (
 <div className="pointer-events-none absolute inset-0 -z-10 scale-[0.97] ">
 {under}
 </div>
 ) : null}

 <div
 className={cn(
 "relative touch-pan-y select-none will-change-transform rounded-2xl",
 dragging ? "transition-none" : "transition-transform ease-out",
 )}
 style={{
 transform: `translateX(${tx}px) rotate(${rotate}deg)`,
 transitionDuration: flying
 ? `${FLY_DURATION_MS}ms`
 : dragging
 ? "0ms"
 : "200ms",
 boxShadow,
 }}
 onPointerDown={onPointerDown}
 onPointerMove={onPointerMove}
 onPointerUp={onPointerUp}
 onPointerCancel={onPointerUp}
 >
 {top}
 </div>
 </div>
 );
};
