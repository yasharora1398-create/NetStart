import { ReactNode } from "react";
import { Signal, Wifi, BatteryFull } from "lucide-react";

export const PhoneFrame = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`relative mx-auto ${className}`} style={{ width: 380 }}>
    {/* Glow */}
    <div className="absolute -inset-8 bg-gradient-to-b from-gold/20 via-gold/5 to-transparent blur-3xl -z-10" />

    {/* Device */}
    <div className="relative rounded-[3rem] bg-gradient-to-b from-[#222] to-[#0a0a0a] p-[3px] shadow-card">
      <div className="rounded-[2.85rem] bg-obsidian p-2">
        <div className="relative rounded-[2.4rem] overflow-hidden bg-background border border-border/60" style={{ height: 780 }}>
          {/* Status bar */}
          <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-7 pt-3 pb-2 text-[11px] font-mono text-foreground">
            <span>9:41</span>
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-28 h-6 bg-obsidian rounded-full" />
            <div className="flex items-center gap-1.5">
              <Signal className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
              <BatteryFull className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Content */}
          <div className="absolute inset-0 pt-10 overflow-hidden">{children}</div>

          {/* Home indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-foreground/40 z-30" />
        </div>
      </div>
    </div>
  </div>
);
