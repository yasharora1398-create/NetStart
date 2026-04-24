import logoSrc from "@/assets/netstart-logo.png";

export const Logo = ({ className = "" }: { className?: string }) => (
  <div
    className={`relative h-9 w-36 overflow-hidden rounded-sm ${className}`}
    aria-label="NetStart"
  >
    <img
      src={logoSrc}
      alt="NetStart"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-auto scale-[3.4]"
      draggable={false}
    />
  </div>
);
