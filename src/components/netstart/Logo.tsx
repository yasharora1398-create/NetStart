// Wordmark + moth logo. The image is served from /polln8-logo.svg in
// the public/ folder so it can be swapped without rebuilding (same
// file the favicon and the waitlist nav point at).
export const Logo = ({ className = "" }: { className?: string }) => (
  <div
    className={`flex items-center gap-2 ${className}`}
    aria-label="Polln8"
  >
    <img
      src="/polln8-logo.svg"
      alt=""
      className="h-8 w-8 object-contain"
      draggable={false}
    />
    <span className="font-display text-xl tracking-[-0.02em] text-foreground">
      Polln8
    </span>
  </div>
);
