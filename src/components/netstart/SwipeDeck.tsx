import { useState } from "react";
import { Check, X, Bookmark, Zap, Target, Clock } from "lucide-react";
import builder1 from "@/assets/builder-1.jpg";
import builder2 from "@/assets/builder-2.jpg";
import builder3 from "@/assets/builder-3.jpg";

type Builder = {
  name: string;
  role: string;
  location: string;
  image: string;
  match: number;
  ships: string;
  commitment: string;
  skills: string[];
  proof: string;
  building: string;
};

const BUILDERS: Builder[] = [
  {
    name: "Marcus Vey",
    role: "Founding Engineer · ex-Stripe",
    location: "San Francisco",
    image: builder1,
    match: 94,
    ships: "0→1 in 21 days",
    commitment: "Full-time · No salary",
    skills: ["Rust", "Distributed systems", "Payments infra"],
    proof: "Shipped 4 production systems. $40M ARR at last role.",
    building: "Looking for a non-technical cofounder with deep fintech network.",
  },
  {
    name: "Elena Rusk",
    role: "Product & Growth · 2x Founder",
    location: "New York",
    image: builder2,
    match: 91,
    ships: "0→1 in 30 days",
    commitment: "Full-time · Equity-first",
    skills: ["Marketplaces", "B2B GTM", "Pricing"],
    proof: "Acquired by Square (2022). Took prev. startup to $8M ARR.",
    building: "Hunting a technical cofounder for vertical AI in logistics.",
  },
  {
    name: "Kai Nakamura",
    role: "Design Engineer · ex-Linear",
    location: "Remote · EU",
    image: builder3,
    match: 88,
    ships: "0→1 in 14 days",
    commitment: "Part-time · Open to FT",
    skills: ["Product design", "TypeScript", "Motion"],
    proof: "Designed 3 of YC's top-rated developer tools.",
    building: "Want to join a serious team rebuilding CRM from first principles.",
  },
];

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

  const imgH = compact ? "h-[300px]" : "h-[440px]";

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
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-obsidian/80 backdrop-blur border border-gold/30">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-gold" />
            <span className="font-mono text-xs text-gold">{current.match}% MATCH</span>
          </div>

          {/* Verified */}
          <div className="absolute top-4 left-4 flex items-center gap-1 px-2.5 py-1 rounded-sm bg-success/15 border border-success/30">
            <Check className="h-3 w-3 text-success" />
            <span className="text-[10px] uppercase tracking-widest text-success font-medium">Verified</span>
          </div>

          {/* Identity */}
          <div className="absolute bottom-0 inset-x-0 p-6">
            <h3 className="font-display text-3xl leading-none mb-1">{current.name}</h3>
            <p className="text-sm text-muted-foreground">{current.role}</p>
            <p className="text-xs text-muted-foreground/70 mt-1 font-mono uppercase tracking-wider">{current.location}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Stat icon={<Zap className="h-3.5 w-3.5" />} label="Ships" value={current.ships} />
            <Stat icon={<Clock className="h-3.5 w-3.5" />} label="Commit" value={current.commitment} />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-mono">Proof</p>
            <p className="text-sm leading-relaxed">{current.proof}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-mono">Looking for</p>
            <p className="text-sm leading-relaxed text-foreground/80">{current.building}</p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {current.skills.map((s) => (
              <span key={s} className="px-2.5 py-1 text-xs border border-border rounded-sm text-muted-foreground hover:border-gold/40 hover:text-foreground transition-colors">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Decision row */}
        <div className="flex items-center justify-between gap-3 px-6 pb-6">
          <DecisionBtn onClick={() => decide("left")} aria-label="Pass">
            <X className="h-5 w-5" />
          </DecisionBtn>
          <DecisionBtn variant="ghost" aria-label="Save">
            <Bookmark className="h-5 w-5" />
          </DecisionBtn>
          <DecisionBtn variant="gold" onClick={() => decide("right")} aria-label="Connect">
            <Target className="h-5 w-5" />
          </DecisionBtn>
        </div>
      </article>

      <p className="text-center text-xs text-muted-foreground mt-6 font-mono uppercase tracking-widest">
        Tap <span className="text-gold">target</span> to connect · <span className="text-foreground">×</span> to pass
      </p>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="border border-border rounded-sm p-3">
    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
      {icon}
      <span className="text-[10px] uppercase tracking-widest font-mono">{label}</span>
    </div>
    <p className="text-xs font-medium">{value}</p>
  </div>
);

const DecisionBtn = ({
  children,
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "gold" | "ghost" }) => {
  const styles = {
    default: "border border-border bg-card hover:border-destructive hover:text-destructive",
    gold: "bg-gradient-gold text-primary-foreground hover:shadow-glow scale-110",
    ghost: "border border-border bg-card hover:border-foreground/40 text-muted-foreground hover:text-foreground",
  }[variant];
  return (
    <button
      {...props}
      className={`flex-1 h-12 rounded-sm flex items-center justify-center transition-all duration-300 ${styles}`}
    />
  );
};
