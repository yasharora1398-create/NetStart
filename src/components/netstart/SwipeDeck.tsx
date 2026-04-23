import { useState } from "react";
import { Check, X, Bookmark, Zap, Target, Clock } from "lucide-react";
import { BUILDERS } from "@/lib/builders";

export const SwipeDeck = ({ compact = false }: { compact?: boolean }) => {
  const [index, setIndex] = useState(0);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);

  const current = BUILDERS[index % BUILDERS.length];
  const next = BUILDERS[(index + 1) % BUILDERS.length];

  const decide = (dir: "left" | "right") => {
    setExitDir(dir);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setExitDir(null);
    }, 380);
  };

  const imgH = compact ? "h-[220px]" : "h-[440px]";
  const bodyPad = compact ? "p-4 space-y-3" : "p-6 space-y-5";
  const decisionPad = compact ? "px-4 pb-4" : "px-6 pb-6";
  const nameSize = compact ? "text-2xl" : "text-3xl";
  const identityPad = compact ? "p-4" : "p-6";
  const btnHeight = compact ? "h-10" : "h-12";

  return (
    <div className={`relative w-full ${compact ? "" : "max-w-[380px]"} mx-auto`}>
      <div className="absolute inset-0 translate-y-3 scale-[0.96] rounded-lg bg-carbon border border-border opacity-60" aria-hidden>
        <img src={next.image} alt="" className="w-full h-full object-cover rounded-lg opacity-30" loading="lazy" />
      </div>

      {/* Active card */}
      <article
        key={index}
        className={`relative rounded-lg overflow-hidden bg-card border border-border shadow-card animate-card-in ${
          exitDir === "right" ? "animate-swipe-out-right" : exitDir === "left" ? "animate-swipe-out-left" : ""
        }`}
      >
        <div className={`relative ${imgH}`}>
          <img
            src={current.image}
            alt={current.name}
            width={768}
            height={1024}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />

          {/* Match badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-obsidian/80 backdrop-blur border border-gold/30">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-gold" />
            <span className="font-mono text-[10px] text-gold">{current.match}% MATCH</span>
          </div>

          {/* Verified */}
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-sm bg-success/15 border border-success/30">
            <Check className="h-3 w-3 text-success" />
            <span className="text-[9px] uppercase tracking-widest text-success font-medium">Verified</span>
          </div>

          {/* Identity */}
          <div className={`absolute bottom-0 inset-x-0 ${identityPad}`}>
            <h3 className={`font-display ${nameSize} leading-none mb-1`}>{current.name}</h3>
            <p className="text-xs text-muted-foreground">{current.role}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono uppercase tracking-wider">{current.location}</p>
          </div>
        </div>

        {/* Body */}
        <div className={bodyPad}>
          <div className="grid grid-cols-2 gap-2">
            <Stat icon={<Zap className="h-3 w-3" />} label="Ships" value={current.ships} compact={compact} />
            <Stat icon={<Clock className="h-3 w-3" />} label="Commit" value={current.commitment} compact={compact} />
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1 font-mono">Proof</p>
            <p className={`${compact ? "text-xs line-clamp-2" : "text-sm"} leading-relaxed`}>{current.proof}</p>
          </div>

          {!compact && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-mono">Looking for</p>
              <p className="text-sm leading-relaxed text-foreground/80">{current.building}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {current.skills.slice(0, compact ? 4 : current.skills.length).map((s) => (
              <span key={s} className={`${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} border border-border rounded-sm text-muted-foreground hover:border-gold/40 hover:text-foreground transition-colors`}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Decision row */}
        <div className={`flex items-center justify-between gap-2 ${decisionPad}`}>
          <DecisionBtn onClick={() => decide("left")} aria-label="Pass" height={btnHeight}>
            <X className="h-4 w-4" />
          </DecisionBtn>
          <DecisionBtn variant="ghost" aria-label="Save" height={btnHeight}>
            <Bookmark className="h-4 w-4" />
          </DecisionBtn>
          <DecisionBtn variant="gold" onClick={() => decide("right")} aria-label="Connect" height={btnHeight}>
            <Target className="h-4 w-4" />
          </DecisionBtn>
        </div>
      </article>

      {!compact && (
        <p className="text-center text-xs text-muted-foreground mt-6 font-mono uppercase tracking-widest">
          Tap <span className="text-gold">target</span> to connect · <span className="text-foreground">×</span> to pass
        </p>
      )}
    </div>
  );
};

const Stat = ({ icon, label, value, compact }: { icon: React.ReactNode; label: string; value: string; compact?: boolean }) => (
  <div className={`border border-border rounded-sm ${compact ? "p-2" : "p-3"}`}>
    <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
      {icon}
      <span className={`${compact ? "text-[9px]" : "text-[10px]"} uppercase tracking-widest font-mono`}>{label}</span>
    </div>
    <p className={`${compact ? "text-[11px]" : "text-xs"} font-medium`}>{value}</p>
  </div>
);

const DecisionBtn = ({
  children,
  variant = "default",
  height = "h-12",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "gold" | "ghost"; height?: string }) => {
  const styles = {
    default: "border border-border bg-card hover:border-destructive hover:text-destructive",
    gold: "bg-gradient-gold text-primary-foreground hover:shadow-glow scale-110",
    ghost: "border border-border bg-card hover:border-foreground/40 text-muted-foreground hover:text-foreground",
  }[variant];
  return (
    <button
      {...props}
      className={`flex-1 ${height} rounded-sm flex items-center justify-center transition-all duration-300 ${styles}`}
    />
  );
};
