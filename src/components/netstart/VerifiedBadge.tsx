import { cn } from "@/lib/utils";

// X/Twitter-style verified badge: bumpy blue rosette with a white
// check inside. Rendered as inline SVG so it sits cleanly next to
// text without dragging in extra wrapper elements. Pure cosmetic;
// hover-only tooltip ("Verified") for discoverability.
//
// Size defaults to 16px (md) which fits next to display headings.
// Use sm (12px) for tight contexts like chat thread rows, lg
// (20px) for hero name lines.

type Props = {
 size?: "sm" | "md" | "lg";
 className?: string;
};

const SIZE = {
 sm: "h-3.5 w-3.5",
 md: "h-4 w-4",
 lg: "h-5 w-5",
};

export const VerifiedBadge = ({ size = "md", className }: Props) => (
 <svg
 viewBox="0 0 24 24"
 className={cn(
 "inline-flex flex-shrink-0 align-middle",
 SIZE[size],
 className,
 )}
 aria-label="Verified"
 role="img"
 >
 <title>Verified</title>
 {/* Rosette: a 9-pointed star-ish shape, signature X/Twitter look. */}
 <path
 fill="#1d9bf0"
 d="M22.25 12l-2.18-2.5.3-3.3-3.23-.73L15.45 2.5 12.5 3.89 9.55 2.5 7.86 5.47l-3.23.72.3 3.31L2.75 12l2.18 2.5-.3 3.3 3.23.73 1.69 2.97L12.5 20.11l2.95 1.39 1.69-2.97 3.23-.72-.3-3.31z"
 />
 {/* White check inside. Stroke-only so it pops against the blue. */}
 <path
 d="M8.6 12.4l2.6 2.6 4.8-5.4"
 fill="none"
 stroke="#ffffff"
 strokeWidth={2.2}
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 </svg>
);

export default VerifiedBadge;
