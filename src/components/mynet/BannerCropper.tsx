"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Move, X, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";

// Target output aspect (4:1) matches the on-page banner frame. We
// always export at 1600x400 so the cropped JPEG is crisp on retina
// without being unreasonably large.
const OUTPUT_W = 1600;
const OUTPUT_H = 400;
const FRAME_ASPECT = OUTPUT_W / OUTPUT_H; // 4
const MIN_USER_SCALE = 0.1; // allow shrinking below cover; empties get bg color
const MAX_USER_SCALE = 4;
// Background to paint behind a partial image in the saved JPEG. Matches
// the muted card surface used elsewhere so empty space reads as
// intentional negative space, not a render error.
const EMPTY_BG = "#e5e7eb";

type Props = {
 file: File | null;
 open: boolean;
 onClose: () => void;
 onConfirm: (blob: Blob) => Promise<void>;
};

export const BannerCropper = ({ file, open, onClose, onConfirm }: Props) => {
 const [src, setSrc] = useState<string | null>(null);
 const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
 const [frameSize, setFrameSize] = useState<{ w: number; h: number }>({
 w: 0,
 h: 0,
 });
 const [scale, setScale] = useState(1); // user zoom multiplier (>=MIN)
 const [offset, setOffset] = useState({ x: 0, y: 0 });
 const [dragging, setDragging] = useState(false);
 const [saving, setSaving] = useState(false);
 const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
 null,
 );
 const frameRef = useRef<HTMLDivElement | null>(null);
 // Ref to the actually-rendered <img>. We draw from this element on
 // confirm rather than a freshly-created Image() so we know the source
 // is already decoded (the previous approach raced and produced black
 // JPEGs when toBlob fired before the new Image() finished loading).
 const imgRef = useRef<HTMLImageElement | null>(null);

 useEffect(() => {
 if (!file) {
 setSrc(null);
 setNaturalSize(null);
 return;
 }
 const url = URL.createObjectURL(file);
 setSrc(url);
 setScale(1);
 setOffset({ x: 0, y: 0 });
 return () => URL.revokeObjectURL(url);
 }, [file]);

 // Track frame size for the layout math. ResizeObserver keeps offsets
 // clamped when the dialog resizes (eg orientation change).
 useEffect(() => {
 if (!open) return;
 const el = frameRef.current;
 if (!el) return;
 const measure = () => {
 const rect = el.getBoundingClientRect();
 setFrameSize({ w: rect.width, h: rect.height });
 };
 measure();
 const ro = new ResizeObserver(measure);
 ro.observe(el);
 return () => ro.disconnect();
 }, [open, src]);

 // baseScale = "cover" — image at this scale exactly fills the frame.
 // userScale (>=1) is what the slider/wheel multiplies on top.
 const baseScale =
 naturalSize && frameSize.w > 0 && frameSize.h > 0
 ? Math.max(frameSize.w / naturalSize.w, frameSize.h / naturalSize.h)
 : 1;
 const finalScale = baseScale * scale;
 const renderedW = naturalSize ? naturalSize.w * finalScale : 0;
 const renderedH = naturalSize ? naturalSize.h * finalScale : 0;

 // When the image is at least as large as the frame, clamp so it
 // always covers the frame (no peeking edges). When the user zooms
 // out below "cover", the image is smaller than the frame and we
 // allow free positioning so they can place it anywhere; empty
 // areas show the muted bg behind it.
 const clampOffset = useCallback(
 (next: { x: number; y: number }) => {
 if (!naturalSize || frameSize.w === 0) return next;
 const coverX = renderedW >= frameSize.w;
 const coverY = renderedH >= frameSize.h;
 const minX = frameSize.w - renderedW;
 const minY = frameSize.h - renderedH;
 return {
 x: coverX
 ? Math.min(0, Math.max(minX, next.x))
 : Math.max(0, Math.min(minX, next.x)),
 y: coverY
 ? Math.min(0, Math.max(minY, next.y))
 : Math.max(0, Math.min(minY, next.y)),
 };
 },
 [naturalSize, frameSize, renderedW, renderedH],
 );

 // When zoom changes, re-clamp the existing offset so the image still
 // covers the frame at the new scale.
 useEffect(() => {
 setOffset((prev) => clampOffset(prev));
 }, [scale, clampOffset]);

 const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
 const img = e.currentTarget;
 setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
 setOffset({ x: 0, y: 0 });
 setScale(1);
 };

 const beginDrag = (clientX: number, clientY: number) => {
 dragStartRef.current = {
 x: clientX,
 y: clientY,
 ox: offset.x,
 oy: offset.y,
 };
 setDragging(true);
 };
 const moveDrag = (clientX: number, clientY: number) => {
 if (!dragStartRef.current) return;
 const dx = clientX - dragStartRef.current.x;
 const dy = clientY - dragStartRef.current.y;
 setOffset(
 clampOffset({
 x: dragStartRef.current.ox + dx,
 y: dragStartRef.current.oy + dy,
 }),
 );
 };
 const endDrag = () => {
 dragStartRef.current = null;
 setDragging(false);
 };

 const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
 e.preventDefault();
 const delta = -e.deltaY * 0.0015;
 setScale((s) => Math.min(MAX_USER_SCALE, Math.max(MIN_USER_SCALE, s + delta)));
 };

 const handleConfirm = async () => {
 if (!naturalSize || !src) return;
 setSaving(true);
 try {
 const canvas = document.createElement("canvas");
 canvas.width = OUTPUT_W;
 canvas.height = OUTPUT_H;
 const ctx = canvas.getContext("2d");
 if (!ctx) throw new Error("Canvas unavailable.");

 // Fill with the muted bg first so JPEG (no alpha channel) shows
 // a neutral colour where the image doesn't cover, instead of
 // black.
 ctx.fillStyle = EMPTY_BG;
 ctx.fillRect(0, 0, OUTPUT_W, OUTPUT_H);

 // Use the live <img> element rather than a freshly-created
 // Image(). The DOM <img> is guaranteed already decoded (otherwise
 // we wouldn't have naturalSize); a fresh Image() with the same
 // blob URL occasionally raced toBlob and produced a black image.
 const img = imgRef.current;
 if (!img || !img.complete) {
 throw new Error("Image not ready yet, try again.");
 }

 // Map the frame -> destination canvas using the same scale the
 // user sees on screen. The image's position inside the frame is
 // (offset.x, offset.y) in CSS pixels; we render at OUTPUT_W /
 // frameSize.w pixel-per-css factor.
 const px = OUTPUT_W / frameSize.w;
 const py = OUTPUT_H / frameSize.h;
 const drawX = offset.x * px;
 const drawY = offset.y * py;
 const drawW = renderedW * px;
 const drawH = renderedH * py;
 ctx.drawImage(img, drawX, drawY, drawW, drawH);

 const blob: Blob | null = await new Promise((res) =>
 canvas.toBlob((b) => res(b), "image/jpeg", 0.92),
 );
 if (!blob) throw new Error("Could not encode cropped image.");
 await onConfirm(blob);
 } catch (err) {
 // eslint-disable-next-line no-console
 console.error("[cropper] confirm failed", err);
 } finally {
 setSaving(false);
 }
 };

 return (
 <Dialog open={open} onOpenChange={(o) => (o ? undefined : onClose())}>
 <DialogContent className="max-w-2xl p-0 overflow-hidden">
 <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
 <DialogTitle className="font-display text-xl">
 Crop your banner
 </DialogTitle>
 <DialogDescription className="text-xs text-muted-foreground">
 Drag to reposition. Use the slider or scroll-wheel to zoom.
 The dashed frame is exactly what will be saved.
 </DialogDescription>
 </DialogHeader>

 <div className="px-6 py-4">
 {/* Crop stage. The frame is 4:1; the image inside is positioned
 with transform: translate so we can pan it. overflow-hidden
 clips to the frame so what you see is what you get. */}
 <div
 ref={frameRef}
 className="relative w-full overflow-hidden rounded-sm bg-muted border-2 border-dashed border-primary select-none"
 style={{ aspectRatio: String(FRAME_ASPECT), cursor: dragging ? "grabbing" : "grab" }}
 onWheel={onWheel}
 onMouseDown={(e) => {
 e.preventDefault();
 beginDrag(e.clientX, e.clientY);
 }}
 onMouseMove={(e) => {
 if (dragging) moveDrag(e.clientX, e.clientY);
 }}
 onMouseUp={endDrag}
 onMouseLeave={endDrag}
 onTouchStart={(e) => {
 const t = e.touches[0];
 if (t) beginDrag(t.clientX, t.clientY);
 }}
 onTouchMove={(e) => {
 const t = e.touches[0];
 if (t && dragging) moveDrag(t.clientX, t.clientY);
 }}
 onTouchEnd={endDrag}
 >
 {src ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 ref={imgRef}
 src={src}
 alt=""
 draggable={false}
 onLoad={onImgLoad}
 className="absolute top-0 left-0 max-w-none pointer-events-none"
 style={{
 width: renderedW || "auto",
 height: renderedH || "auto",
 transform: `translate(${offset.x}px, ${offset.y}px)`,
 willChange: "transform",
 }}
 />
 ) : (
 <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
 No image selected.
 </div>
 )}

 {/* Move hint - fades on hover so it doesn't get in the way. */}
 {src ? (
 <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-background/90 border border-border px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground pointer-events-none">
 <Move className="h-3 w-3" />
 Drag to reposition
 </div>
 ) : null}
 </div>

 {/* Zoom slider */}
 <div className="mt-4 flex items-center gap-3">
 <ZoomOut className="h-4 w-4 text-muted-foreground" />
 <input
 type="range"
 min={MIN_USER_SCALE}
 max={MAX_USER_SCALE}
 step={0.01}
 value={scale}
 onChange={(e) => setScale(parseFloat(e.target.value))}
 className="flex-1 accent-primary"
 aria-label="Zoom"
 />
 <ZoomIn className="h-4 w-4 text-muted-foreground" />
 <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground w-12 text-right">
 {scale.toFixed(2)}×
 </span>
 </div>
 </div>

 <DialogFooter className="px-6 py-4 border-t border-border flex sm:justify-between gap-2">
 <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
 <X className="h-4 w-4" />
 Cancel
 </Button>
 <Button
 variant="gold"
 size="sm"
 onClick={handleConfirm}
 disabled={!src || saving}
 >
 {saving ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" />
 Saving…
 </>
 ) : (
 "Save banner"
 )}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 );
};

export default BannerCropper;
