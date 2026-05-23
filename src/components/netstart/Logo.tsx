// Wordmark + moth logo. The image is served from /polln8-logo.png in
// the public/ folder so it can be swapped without rebuilding (same
// file the favicon and the waitlist nav point at).
export const Logo = ({ className = "" }: { className?: string }) => (
 <div
 className={`flex items-center gap-2 ${className}`}
 aria-label="Polln8"
 >
 <img
 src="/polln8-logo.png"
 alt=""
 className="h-12 w-12 object-contain"
 draggable={false}
 />
 <span className="font-display text-2xl tracking-[-0.02em] text-foreground">
 Polln8
 </span>
 </div>
);
