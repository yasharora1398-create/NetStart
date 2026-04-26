import { useState } from "react";
import {
  Bell,
  Briefcase,
  Flame,
  MapPin,
  MessageCircle,
  Search,
  Send,
  User,
} from "lucide-react";
import { SwipeDeck } from "./SwipeDeck";
import { BUILDERS } from "@/lib/builders";

type BottomTab = "match" | "browse" | "threads" | "you";
type MatchTab = "foryou" | "saved" | "startups";

const SAMPLE_THREADS = BUILDERS.map((b, i) => ({
  id: b.id,
  name: b.name,
  image: b.image,
  preview:
    i === 0
      ? "Sounds great. Free thursday at 2?"
      : i === 1
        ? "Sent over the deck. LMK what you think."
        : "Yeah, let's talk this week.",
  time: i === 0 ? "2m" : i === 1 ? "1h" : "Tue",
  unread: i === 0,
}));

export const AppShell = () => {
  const [tab, setTab] = useState<BottomTab>("match");
  const [matchTab, setMatchTab] = useState<MatchTab>("foryou");
  const [bellOpen, setBellOpen] = useState(false);

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* App header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border/60 z-20 bg-background">
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-sm bg-gradient-gold flex items-center justify-center">
            <span className="font-display text-[11px] text-primary-foreground leading-none">
              N
            </span>
          </div>
          <span className="font-display text-base tracking-tight">NetStart</span>
        </div>
        <button
          type="button"
          onClick={() => setBellOpen((v) => !v)}
          className="relative h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
        </button>
      </header>

      {/* Bell dropdown */}
      {bellOpen && (
        <div className="absolute top-14 right-3 z-30 w-60 rounded-sm border border-gold-soft bg-card shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-background/40">
            <p className="font-mono text-[10px] uppercase tracking-widest text-gold">
              New
            </p>
          </div>
          <ul className="divide-y divide-border">
            <NotifItem title="Marcus accepted" body="Re: Vertical AI for ops" />
            <NotifItem title="Elena saved your project" body="Marketplaces v2" />
            <NotifItem title="Profile reviewed" body="You're live as a candidate." />
          </ul>
        </div>
      )}

      {/* Match top tabs */}
      {tab === "match" && (
        <div className="flex items-center gap-5 px-5 pt-3 text-xs font-mono uppercase tracking-widest border-b border-border/40">
          <TopTab
            label="For you"
            active={matchTab === "foryou"}
            onClick={() => setMatchTab("foryou")}
          />
          <TopTab
            label="Saved"
            active={matchTab === "saved"}
            onClick={() => setMatchTab("saved")}
          />
          <TopTab
            label="Startups"
            active={matchTab === "startups"}
            onClick={() => setMatchTab("startups")}
          />
        </div>
      )}

      {/* Screen body */}
      <div className="flex-1 overflow-y-auto pb-20 scrollbar-none">
        {tab === "match" && matchTab === "foryou" && (
          <div className="px-4 pt-4">
            <SwipeDeck compact />
          </div>
        )}

        {tab === "match" && matchTab === "saved" && <SavedScreen />}
        {tab === "match" && matchTab === "startups" && <StartupsScreen />}
        {tab === "browse" && <BrowseScreen />}
        {tab === "threads" && <ThreadsScreen />}
        {tab === "you" && <YouScreen />}
      </div>

      {/* Bottom tab bar */}
      <nav className="absolute bottom-0 inset-x-0 bg-obsidian/95 backdrop-blur-xl border-t border-border/60 px-6 py-2.5 pb-5 flex items-center justify-between z-20">
        <TabIcon
          icon={<Flame className="h-5 w-5" />}
          label="Match"
          active={tab === "match"}
          onClick={() => setTab("match")}
        />
        <TabIcon
          icon={<Search className="h-5 w-5" />}
          label="Browse"
          active={tab === "browse"}
          onClick={() => setTab("browse")}
        />
        <TabIcon
          icon={<MessageCircle className="h-5 w-5" />}
          label="Threads"
          active={tab === "threads"}
          onClick={() => setTab("threads")}
        />
        <TabIcon
          icon={<User className="h-5 w-5" />}
          label="You"
          active={tab === "you"}
          onClick={() => setTab("you")}
        />
      </nav>
    </div>
  );
};

const TopTab = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`pb-2 transition-colors ${
      active
        ? "text-foreground border-b-2 border-gold"
        : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {label}
  </button>
);

const TabIcon = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-colors ${
      active ? "text-gold" : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {icon}
    <span className="text-[9px] font-mono uppercase tracking-widest">
      {label}
    </span>
  </button>
);

const NotifItem = ({ title, body }: { title: string; body: string }) => (
  <li className="px-3 py-2.5 hover:bg-background/60 transition-colors">
    <p className="text-[12px] font-medium text-foreground leading-tight">
      {title}
    </p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{body}</p>
  </li>
);

// ---- Screens -------------------------------------------------------

const SavedScreen = () => (
  <div className="px-4 pt-4 space-y-2.5">
    {BUILDERS.map((b) => (
      <article
        key={b.id}
        className="rounded-sm border border-border bg-card p-3 flex gap-3 items-center"
      >
        <img
          src={b.image}
          alt={b.name}
          className="h-12 w-12 rounded-sm object-cover flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{b.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{b.role}</p>
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70 mt-0.5">
            <MapPin className="inline h-2.5 w-2.5 mr-1 text-gold" />
            {b.location}
          </p>
        </div>
        <span className="px-1.5 py-0.5 rounded-sm border border-gold/40 bg-gold/10 text-[9px] font-mono uppercase tracking-widest text-gold flex-shrink-0">
          Saved
        </span>
      </article>
    ))}
    <p className="text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 pt-2">
      Tap a card to message
    </p>
  </div>
);

const StartupsScreen = () => (
  <div className="px-4 pt-4 space-y-3">
    {BUILDERS.map((b) => (
      <article
        key={b.id}
        className="rounded-sm border border-border bg-card p-4"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-gold mb-0.5">
              Hiring · {b.commitment}
            </p>
            <h3 className="font-display text-base leading-tight">
              {b.building}
            </h3>
          </div>
          <span className="px-1.5 py-0.5 rounded-sm bg-gold/10 border border-gold/30 font-mono text-[9px] text-gold flex-shrink-0">
            {b.match}%
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {b.proof}
        </p>
        <div className="flex flex-wrap gap-1 mb-3">
          {b.skills.slice(0, 4).map((s) => (
            <span
              key={s}
              className="px-1.5 py-0.5 text-[9px] rounded-sm border border-border text-muted-foreground"
            >
              {s}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70">
            by {b.name}
          </p>
          <button
            type="button"
            className="px-2.5 py-1 rounded-sm bg-gradient-gold text-primary-foreground text-[10px] font-medium"
          >
            Apply
          </button>
        </div>
      </article>
    ))}
  </div>
);

const BrowseScreen = () => (
  <div className="px-4 pt-4">
    <div className="relative mb-3">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search projects..."
        className="w-full h-9 pl-8 pr-2.5 rounded-sm border border-border bg-card text-xs focus:outline-none focus:border-gold/40"
        readOnly
      />
    </div>
    <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-none">
      {["AI / ML", "Marketplaces", "Fintech", "Climate", "DevTools"].map(
        (chip, i) => (
          <span
            key={chip}
            className={`px-2 py-1 rounded-sm border text-[10px] font-mono uppercase tracking-widest flex-shrink-0 ${
              i === 0
                ? "border-gold/40 bg-gold/10 text-gold"
                : "border-border text-muted-foreground"
            }`}
          >
            {chip}
          </span>
        ),
      )}
    </div>
    <div className="space-y-2.5">
      {BUILDERS.map((b) => (
        <article
          key={b.id}
          className="rounded-sm border border-border bg-card p-3"
        >
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="font-display text-sm leading-tight truncate">
              {b.building}
            </h3>
            <span className="px-1.5 py-0.5 rounded-sm bg-gold/10 border border-gold/30 font-mono text-[9px] text-gold flex-shrink-0 ml-2">
              {b.match}%
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2 truncate">
            <Briefcase className="inline h-2.5 w-2.5 mr-1 text-gold" />
            {b.commitment} · {b.location}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70">
              by {b.name}
            </p>
            <button
              type="button"
              className="text-[10px] text-gold font-mono uppercase tracking-widest"
            >
              Open ›
            </button>
          </div>
        </article>
      ))}
    </div>
  </div>
);

const ThreadsScreen = () => (
  <div className="pt-1">
    <ul className="divide-y divide-border">
      {SAMPLE_THREADS.map((t) => (
        <li key={t.id} className="px-4 py-3 flex gap-3 items-center">
          <img
            src={t.image}
            alt={t.name}
            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p
                className={`text-sm truncate ${
                  t.unread ? "font-semibold" : ""
                }`}
              >
                {t.name}
              </p>
              <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70 flex-shrink-0">
                {t.time}
              </span>
            </div>
            <p
              className={`text-[11px] truncate ${
                t.unread ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {t.preview}
            </p>
          </div>
          {t.unread && (
            <span className="h-2 w-2 rounded-full bg-gold flex-shrink-0" />
          )}
        </li>
      ))}
    </ul>
    <div className="px-4 pt-4">
      <div className="rounded-sm border border-dashed border-border bg-card/40 p-4 text-center">
        <Send className="h-4 w-4 text-gold mx-auto mb-2" />
        <p className="text-[11px] text-muted-foreground">
          Tap a connection to start a thread
        </p>
      </div>
    </div>
  </div>
);

const YouScreen = () => {
  const me = BUILDERS[0];
  return (
    <div className="px-4 pt-5 pb-4">
      <div className="flex items-center gap-3 mb-5">
        <img
          src={me.image}
          alt={me.name}
          className="h-16 w-16 rounded-sm object-cover border border-gold/30 flex-shrink-0"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] uppercase tracking-widest text-gold mb-0.5">
            Profile
          </p>
          <h2 className="font-display text-lg leading-tight truncate">
            {me.name}
          </h2>
          <p className="text-[11px] text-muted-foreground truncate">
            {me.role}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <Stat label="Saves" value="14" />
        <Stat label="Sent" value="6" />
        <Stat label="Matches" value="3" />
      </div>

      <div className="rounded-sm border border-border bg-card p-3 mb-3">
        <p className="text-[9px] font-mono uppercase tracking-widest text-gold mb-1">
          Open to work
        </p>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Visible to founders
          </p>
          <span className="h-5 w-9 rounded-full bg-gold relative">
            <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-obsidian" />
          </span>
        </div>
      </div>

      <div className="rounded-sm border border-border bg-card p-3 mb-3">
        <p className="text-[9px] font-mono uppercase tracking-widest text-gold mb-1">
          Skills
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {me.skills.slice(0, 5).map((s) => (
            <span
              key={s}
              className="px-1.5 py-0.5 text-[10px] rounded-sm border border-gold/30 bg-gold/5"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="w-full py-2 rounded-sm border border-gold/40 bg-gold/5 text-gold text-[11px] font-mono uppercase tracking-widest"
      >
        Edit profile
      </button>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-sm border border-border bg-card p-2 text-center">
    <p className="font-display text-base text-foreground leading-none">
      {value}
    </p>
    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
      {label}
    </p>
  </div>
);
