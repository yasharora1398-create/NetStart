import { SwipeDeck } from "./SwipeDeck";
import { Flame, Search, MessageCircle, User, Bell } from "lucide-react";

/** Mobile app shell shown inside the PhoneFrame */
export const AppShell = () => {
  return (
    <div className="h-full flex flex-col bg-background">
      {/* App header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border/60">
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-sm bg-gradient-gold flex items-center justify-center">
            <span className="font-display text-[11px] text-primary-foreground leading-none">N</span>
          </div>
          <span className="font-display text-base tracking-tight">NetStart</span>
        </div>
        <button className="relative h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
        </button>
      </header>

      {/* Tab strip */}
      <div className="flex items-center gap-5 px-5 pt-3 text-xs font-mono uppercase tracking-widest">
        <span className="text-foreground border-b-2 border-gold pb-2">For you</span>
        <span className="text-muted-foreground pb-2">Saved</span>
        <span className="text-muted-foreground pb-2">Startups</span>
      </div>

      {/* Deck */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 scrollbar-none">
        <SwipeDeck compact />
      </div>

      {/* Bottom tab bar */}
      <nav className="absolute bottom-0 inset-x-0 bg-obsidian/95 backdrop-blur-xl border-t border-border/60 px-6 py-2.5 pb-5 flex items-center justify-between">
        <TabIcon icon={<Flame className="h-5 w-5" />} label="Match" active />
        <TabIcon icon={<Search className="h-5 w-5" />} label="Browse" />
        <TabIcon icon={<MessageCircle className="h-5 w-5" />} label="Threads" />
        <TabIcon icon={<User className="h-5 w-5" />} label="You" />
      </nav>
    </div>
  );
};

const TabIcon = ({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) => (
  <button className={`flex flex-col items-center gap-1 ${active ? "text-gold" : "text-muted-foreground"}`}>
    {icon}
    <span className="text-[9px] font-mono uppercase tracking-widest">{label}</span>
  </button>
);
