/**
 * Sidebar — frosted-glass nav panel. App + About sections of NavLink
 * items, each with a 16x16 stroke icon. Light/Dark segmented toggle
 * at the bottom drives the global theme via `useTheme()`.
 */
import { NavLink } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";

type IconType = React.ComponentType;

type Item = { to: string; label: string; icon: IconType };

const APP_ITEMS: Item[] = [
  { to: "/mynet", label: "MyNet", icon: MyNetIcon },
  { to: "/match", label: "Match", icon: MatchIcon },
  { to: "/talent", label: "Talents", icon: TalentsIcon },
  { to: "/chats", label: "Chat", icon: ChatIcon },
];

const ABOUT_ITEMS: Item[] = [
  { to: "/how", label: "How it works", icon: HowItWorksIcon },
  { to: "/standards", label: "Standards", icon: StandardsIcon },
  { to: "/download", label: "Download", icon: DownloadIcon },
];

export const Sidebar = () => {
  const { mode, setMode } = useTheme();

  return (
    <aside className="glass-sidebar" aria-label="Sidebar">
      {/* Brand */}
      <div className="gs-brand">
        <div className="gs-brand-mark">P8</div>
        <div>
          <div className="gs-brand-name">Polln8</div>
          <div className="gs-brand-sub">Build with intent</div>
        </div>
      </div>

      {/* App */}
      <div className="gs-section">
        <div className="gs-section-label">App</div>
        {APP_ITEMS.map((item) => (
          <SideLink key={item.to} item={item} />
        ))}
      </div>

      {/* About */}
      <div className="gs-section">
        <div className="gs-section-label">About</div>
        {ABOUT_ITEMS.map((item) => (
          <SideLink key={item.to} item={item} />
        ))}
      </div>

      <div className="gs-spacer" />

      {/* Theme toggle — wired to global useTheme so it flips the
          .dark class on <html> and persists to localStorage. */}
      <div className="gs-theme">
        <div className="gs-theme-label">Theme</div>
        <div className="gs-seg" role="group" aria-label="Theme">
          <button
            type="button"
            aria-pressed={mode === "light"}
            onClick={() => setMode("light")}
          >
            <SunIcon />
            Light
          </button>
          <button
            type="button"
            aria-pressed={mode === "dark"}
            onClick={() => setMode("dark")}
          >
            <MoonIcon />
            Dark
          </button>
        </div>
      </div>
    </aside>
  );
};

const SideLink = ({ item }: { item: Item }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `gs-item${isActive ? " gs-active" : ""}`
      }
    >
      <span className="gs-ico" aria-hidden="true">
        <Icon />
      </span>
      <span>{item.label}</span>
    </NavLink>
  );
};

// ============== ICONS — verbatim paths from Sidebar.html ==============

function MyNetIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="3.5" cy="4" r="1.5" />
      <circle cx="12.5" cy="4" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
      <path d="M5 4 H11 M4.4 5.2 L7.2 10.8 M11.6 5.2 L8.8 10.8" />
    </svg>
  );
}

function MatchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 5 H10 L8.2 3.2 M2.5 5 L4.3 6.8" />
      <path d="M13.5 11 H6 L7.8 12.8 M13.5 11 L11.7 9.2" />
    </svg>
  );
}

function TalentsIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2.2 L9.3 6.7 L13.8 8 L9.3 9.3 L8 13.8 L6.7 9.3 L2.2 8 L6.7 6.7 Z" />
      <path d="M13 2.2 L13.5 3.5 L14.8 4 L13.5 4.5 L13 5.8 L12.5 4.5 L11.2 4 L12.5 3.5 Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 4.2 a1.7 1.7 0 0 1 1.7-1.7 h7.6 a1.7 1.7 0 0 1 1.7 1.7 v5.1 a1.7 1.7 0 0 1 -1.7 1.7 H7 L4 13.5 v-2.5 H4.2 A1.7 1.7 0 0 1 2.5 9.3 Z" />
    </svg>
  );
}

function HowItWorksIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="5.6" />
      <path d="M6.4 6.4 a1.6 1.6 0 1 1 2.4 1.4 c-0.5 0.3 -0.8 0.6 -0.8 1.2" />
      <circle cx="8" cy="11.4" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function StandardsIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2 L13 4 v3.5 c0 3.2 -2.2 5.6 -5 6.5 c-2.8 -0.9 -5 -3.3 -5 -6.5 V4 Z" />
      <path d="M5.8 8.1 L7.4 9.6 L10.4 6.6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2.5 V10" />
      <path d="M5 7 L8 10 L11 7" />
      <path d="M3 12.5 H13" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5 V3 M8 13 V14.5 M1.5 8 H3 M13 8 H14.5 M3.4 3.4 L4.5 4.5 M11.5 11.5 L12.6 12.6 M3.4 12.6 L4.5 11.5 M11.5 4.5 L12.6 3.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 9.5 A5.5 5.5 0 1 1 6.5 3 A4.4 4.4 0 0 0 13 9.5 Z" />
    </svg>
  );
}
