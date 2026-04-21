export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="relative h-7 w-7">
      <div className="absolute inset-0 rounded-sm bg-gradient-gold" />
      <div className="absolute inset-[3px] rounded-[2px] bg-obsidian flex items-center justify-center">
        <span className="font-display text-gold text-sm leading-none">N</span>
      </div>
    </div>
    <span className="font-display text-lg tracking-tight">
      Net<span className="text-gradient-gold">Start</span>
    </span>
  </div>
);
