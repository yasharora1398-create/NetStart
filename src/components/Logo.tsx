import mascot from "@/assets/netstart-mascot.png";
import { assetUrl } from "@/lib/asset-url";

interface LogoProps {
 size?: "sm" | "md" | "lg";
 showWordmark?: boolean;
}

export const Logo = ({ size = "md", showWordmark = true }: LogoProps) => {
 const dims = {
 sm: { img: "h-7 w-7", text: "text-lg" },
 md: { img: "h-9 w-9", text: "text-2xl" },
 lg: { img: "h-12 w-12", text: "text-3xl" },
 }[size];

 return (
 <div className="flex items-center gap-2">
 <img
 src={assetUrl(mascot)}
 alt="NetStart mascot"
 className={`${dims.img} animate-bounce-soft`}
 width={48}
 height={48}
 />
 {showWordmark && (
 <span className={`font-display font-black tracking-tight ${dims.text}`}>
 net<span className="text-primary-glow">start</span>
 </span>
 )}
 </div>
 );
};
