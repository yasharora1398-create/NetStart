import { cn } from "@/lib/utils";

interface SkillPillProps {
  label: string;
  active?: boolean;
  className?: string;
  size?: "sm" | "md";
  variant?: "default" | "yellow" | "pink" | "green" | "orange";
}

export const SkillPill = ({ label, active = false, className, size = "md", variant = "default" }: SkillPillProps) => {
  const variantStyles = {
    default: active
      ? "border-foreground bg-primary text-primary-foreground"
      : "border-foreground/30 bg-card text-foreground/85",
    yellow: "border-foreground bg-pop-yellow text-background",
    pink: "border-foreground bg-pop-pink text-background",
    green: "border-foreground bg-pop-green text-background",
    orange: "border-foreground bg-pop-orange text-background",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 font-semibold transition-all",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
};
