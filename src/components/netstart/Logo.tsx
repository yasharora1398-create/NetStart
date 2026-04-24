import logoSrc from "@/assets/netstart-logo.png";

export const Logo = ({ className = "" }: { className?: string }) => (
  <div
    className={`relative h-10 w-40 overflow-hidden ${className}`}
    aria-label="NetStart"
  >
    <img
      src={logoSrc}
      alt="NetStart"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none"
      style={{ width: "200px", height: "200px" }}
      draggable={false}
    />
  </div>
);
