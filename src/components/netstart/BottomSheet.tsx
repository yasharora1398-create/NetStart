/**
 * Mobile bottom sheet. Slides up from the bottom of the screen to
 * ~85% of the viewport so the page underneath stays visible at
 * the top. A small drag-handle bar at the top lets the user swipe
 * the sheet back down to dismiss. Used by the Match info panel
 * and the filter modal.
 *
 * Stays mounted so the slide animation runs in both directions;
 * pointer events are blocked while closed so it never catches
 * stray taps.
 */
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
 open: boolean;
 onClose: () => void;
 children: ReactNode;
 /** Override the height. Default 85dvh leaves a top "crack" for
 * the underlying page to peek through. */
 heightClass?: string;
};

const DISMISS_PX = 100;

export const BottomSheet = ({
 open,
 onClose,
 children,
 heightClass = "h-[85dvh]",
}: Props) => {
 const [dy, setDy] = useState(0);
 const [dragging, setDragging] = useState(false);
 const startRef = useRef<{ y: number; pointerId: number } | null>(null);

 const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
 startRef.current = { y: e.clientY, pointerId: e.pointerId };
 setDragging(true);
 (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
 };

 const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
 if (!startRef.current) return;
 if (e.pointerId !== startRef.current.pointerId) return;
 setDy(Math.max(0, e.clientY - startRef.current.y));
 };

 const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
 if (!startRef.current) return;
 if (e.pointerId !== startRef.current.pointerId) return;
 startRef.current = null;
 setDragging(false);
 if (dy > DISMISS_PX) {
 onClose();
 // Reset dy after the close transition so a re-open starts
 // from translateY(100%) again.
 window.setTimeout(() => setDy(0), 320);
 } else {
 setDy(0);
 }
 };

 return (
 <div
 className={cn(
 "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl border-t border-border bg-card shadow-2xl",
 heightClass,
 )}
 style={{
 transform: open
 ? `translateY(${dy}px)`
 : "translateY(100%)",
 transition: dragging
 ? "none"
 : "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
 pointerEvents: open ? "auto" : "none",
 paddingBottom: "env(safe-area-inset-bottom)",
 }}
 aria-hidden={!open}
 >
 {/* Drag handle - pointer events on this strip drive the
 swipe-down dismiss. Made larger than the visible bar so
 the touch target is comfortable. */}
 <div
 className="flex justify-center pt-3 pb-2 touch-none cursor-grab active:cursor-grabbing"
 onPointerDown={onPointerDown}
 onPointerMove={onPointerMove}
 onPointerUp={onPointerUp}
 onPointerCancel={onPointerUp}
 >
 <div className="h-1.5 w-12 rounded-full bg-muted-foreground" />
 </div>
 <div className="flex-1 overflow-y-auto">{children}</div>
 </div>
 );
};
