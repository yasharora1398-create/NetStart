/**
 * Sidebar - frosted-glass nav panel. App + About sections of NavLink
 * items, each with a 16x16 stroke icon. Light/Dark segmented toggle
 * at the bottom drives the global theme via `useTheme()`.
 *
 * Owns the global --sidebar-width CSS variable: writes 248px on
 * mount, removes it on unmount. Pages that pad past the sidebar use
 * `var(--sidebar-width, 0px)` so they correctly collapse to zero
 * padding on routes where the sidebar isn't rendered (production
 * waitlist, prod /mynet, etc.).
 */
import { useEffect, useState } from "react";
import { Link, NavLink } from "@/lib/router-compat";
import { ChevronLeft, PanelLeftOpen } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useConfirmSignOut } from "@/components/netstart/SignOutConfirm";

const COLLAPSED_KEY = "polln8.sidebar.collapsed";
const EXPANDED_WIDTH = "248px";
// Collapsed reserves zero horizontal space â€” pages take the full
// viewport while the floating top-right strip sits over the content.
const COLLAPSED_WIDTH = "0px";

// Hardcoded admin gate: the Admin section in the sidebar only shows
// when this exact email is signed in. The Admin page itself has its
// own isAdmin gate, so adding this purely for nav visibility.
const ADMIN_EMAIL = "netstartapp@outlook.com";

type IconType = React.ComponentType;

type Item = { to: string; label: string; icon: IconType };

const HOME_ITEMS: Item[] = [
  { to: "/", label: "Home", icon: HomeIcon },
];

const APP_ITEMS: Item[] = [
  { to: "/mynet", label: "MyNet", icon: MyNetIcon },
  { to: "/match", label: "Match", icon: MatchIcon },
  { to: "/saved", label: "Saved", icon: SavedIcon },
  { to: "/chats", label: "Chat", icon: ChatIcon },
];

const ABOUT_ITEMS: Item[] = [
  { to: "/how", label: "How it works", icon: HowItWorksIcon },
  { to: "/standards", label: "Standards", icon: StandardsIcon },
  { to: "/download", label: "Download", icon: DownloadIcon },
];

export const Sidebar = () => {
  const { mode, setMode } = useTheme();
  const { user } = useAuth();
  const confirmSignOut = useConfirmSignOut();

  // Per-user collapse key so two people sharing the same laptop don't
  // share collapse preferences. Falls back to the legacy global key
  // when logged out (so the unauth marketing surfaces still get a
  // reasonable initial state).
  const collapseKey = user?.id
    ? `${COLLAPSED_KEY}.${user.id}`
    : COLLAPSED_KEY;

  // Persist collapse state across sessions; default to expanded so a
  // first-time visitor sees the full nav.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(collapseKey) === "1";
  });

  // When the user actually loads in (auth hydrates from null to
  // signed-in), re-read the per-user key in case it differs from
  // the initial global lookup.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user?.id) return;
    const userKey = `${COLLAPSED_KEY}.${user.id}`;
    const stored = window.localStorage.getItem(userKey);
    if (stored !== null) setCollapsed(stored === "1");
  }, [user?.id]);

  // Drives the global --sidebar-width CSS variable that pages pad
  // past via `var(--sidebar-width, 0px)`. Animating the variable
  // makes the page content slide in/out alongside the sidebar.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
    );
    window.localStorage.setItem(collapseKey, collapsed ? "1" : "0");
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, [collapsed, collapseKey]);

  // Routed through the app-wide confirmation dialog so a single
  // misclick on the avatar menu doesn't drop the session.
  const handleSignOut = () => confirmSignOut();

  // When collapsed, render a thin vertical icon rail on the left
  // edge (mirroring the public IconRail style) instead of the full
  // glass panel. The expand button sits at the top of the rail in
  // the same spot the collapse chevron used to be, so toggling
  // open/closed always lands the cursor in the same area.
  if (collapsed) {
    const isAdminEmail = (user?.email ?? "").toLowerCase() === ADMIN_EMAIL;
    return (
      <CollapsedRail
        onExpand={() => setCollapsed(false)}
        showAdmin={isAdminEmail}
      />
    );
  }

  return (
    <aside
      className="glass-sidebar"
      aria-label="Sidebar"
    >
      {/* Collapse toggle - small chevron at the top-right of the
          sidebar. stopPropagation + preventDefault on the mouse
          event so a misfire near the underlying brand Link can't
          bubble up and trigger a navigation to "/" -- which is
          what previously happened when users clicked the chevron
          from /how. */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCollapsed(true);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="gs-toggle"
        aria-label="Collapse sidebar"
        aria-expanded={true}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      {/* Brand - logo image replaces the P8 square; the whole row is
          a Link to "/" so the brand mark works as a home affordance. */}
      <Link to="/" className="gs-brand gs-brand-link" aria-label="Polln8 home">
        <img
          src="/polln8-logo.png"
          alt=""
          className="gs-brand-logo"
          draggable={false}
        />
        <div className="gs-brand-text">
          <div className="gs-brand-name">Polln8</div>
          <div className="gs-brand-sub">Build with intent</div>
        </div>
      </Link>

      {/* Scrollable middle section. Brand row stays pinned at top,
          theme toggle stays pinned at bottom; everything between
          scrolls when the sections collectively exceed the
          available height (small viewports, lots of nav items, the
          Admin section added for operator users, etc.). */}
      <div className="gs-scroll">
        {/* Home - its own subsection so the home jump is a first-class
            item rather than relying on the brand mark alone. */}
        <div className="gs-section">
          <div className="gs-section-label">Home</div>
          {HOME_ITEMS.map((item) => (
            <SideLink key={item.to} item={item} end />
          ))}
        </div>

        {/* App - MyNet gets a name pill so the user sees whose net it
            is at a glance. Falls back to the email local-part when no
            name was set at signup. */}
        <div className="gs-section">
          <div className="gs-section-label">App</div>
          {APP_ITEMS.map((item) => {
            const pill =
              item.to === "/mynet" && user
                ? userDisplayName(user)
                : undefined;
            return <SideLink key={item.to} item={item} pill={pill} />;
          })}
        </div>

        {/* About */}
        <div className="gs-section">
          <div className="gs-section-label">About</div>
          {ABOUT_ITEMS.map((item) => (
            <SideLink key={item.to} item={item} />
          ))}
        </div>

        {/* Admin - only renders for the operator email. The Admin page
            itself enforces isAdmin so a leaked link still gets bounced. */}
        {(user?.email ?? "").toLowerCase() === ADMIN_EMAIL && (
          <div className="gs-section">
            <div className="gs-section-label">Admin</div>
            <SideLink
              item={{ to: "/admin", label: "Dashboard", icon: AdminIcon }}
            />
          </div>
        )}

        {/* Account - Sign in/Sign up when logged out, Sign out when in. */}
        <div className="gs-section">
          <div className="gs-section-label">Account</div>
          {user ? (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="gs-item"
            >
              <span className="gs-ico" aria-hidden="true">
                <SignOutIcon />
              </span>
              <span>Sign out</span>
            </button>
          ) : (
            <>
              <SideLink
                item={{ to: "/signin", label: "Sign in", icon: SignInIcon }}
              />
              <SideLink
                item={{ to: "/signup", label: "Sign up", icon: SignUpIcon }}
              />
            </>
          )}
        </div>
      </div>

      {/* Theme toggle - wired to global useTheme so it flips the
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

// â”€â”€â”€ Collapsed-state floating top bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// When the user clicks the chevron to collapse the sidebar, the
// full panel disappears and this strip floats at the top-right
// instead â€” mirroring HomeAuthStrip's layout exactly (user pill /
// sign-in/up controls + theme toggle) plus an extra "expand
// sidebar" button so they can bring the nav back.

// Collapsed sidebar: a thin vertical icon rail pinned to the left
// edge, mirroring the public IconRail. The expand button sits at
// the top in the same area as the collapse chevron used to be, so
// the toggle is in a consistent location whether the sidebar is
// open or closed. The expand button is the ONLY opaque button on
// the rail — every other icon is transparent at rest so the user
// knows exactly what brings the sidebar back.

type RailItem = {
  to: string;
  label: string;
  icon: React.ComponentType;
  end?: boolean;
};

const RAIL_ITEMS: RailItem[] = [
  { to: "/", label: "Home", icon: HomeIcon, end: true },
  { to: "/mynet", label: "MyNet", icon: MyNetIcon },
  { to: "/match", label: "Match", icon: MatchIcon },
  { to: "/saved", label: "Saved", icon: SavedIcon },
  { to: "/chats", label: "Chat", icon: ChatIcon },
  { to: "/how", label: "How it works", icon: HowItWorksIcon },
  { to: "/standards", label: "Standards", icon: StandardsIcon },
  { to: "/download", label: "Download", icon: DownloadIcon },
];

const CollapsedRail = ({
  onExpand,
  showAdmin,
}: {
  onExpand: () => void;
  showAdmin: boolean;
}) => {
  const items: RailItem[] = showAdmin
    ? [...RAIL_ITEMS, { to: "/admin", label: "Admin", icon: AdminIcon }]
    : RAIL_ITEMS;

  return (
    <nav
      aria-label="Primary"
      className="fixed left-3 top-4 z-40 hidden md:flex flex-col items-center gap-2"
    >
      {/* Expand: only opaque button on the rail. Same top-left area
          as the collapse chevron in the open panel. */}
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand sidebar"
        title="Expand sidebar"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-gold bg-gold text-white shadow-[0_0_18px_hsl(var(--gold)/0.35)] transition-transform hover:scale-105"
      >
        <PanelLeftOpen className="h-4 w-4" />
      </button>

      <div className="flex flex-col gap-2 mt-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "group relative flex h-11 w-11 items-center justify-center rounded-full border bg-transparent backdrop-blur",
                  "text-muted-foreground transition-all duration-200",
                  "hover:scale-110 hover:border-gold hover:text-gold",
                  isActive ? "border-gold text-gold" : "border-border",
                ].join(" ")
              }
            >
              <Icon />
              <span
                aria-hidden
                className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-full border border-gold bg-card px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-foreground shadow-md opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

// `end` prevents the Home NavLink from staying active on every nested
// route (without it, "/" matches everything because every path starts
// with /). Other items don't need it since they're top-level.
// `pill` renders a small label on the right of the item - used to
// show the signed-in user's name next to MyNet.
const SideLink = ({
  item,
  end = false,
  pill,
}: {
  item: Item;
  end?: boolean;
  pill?: string;
}) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={end}
      className={({ isActive }) =>
        `gs-item${isActive ? " gs-active" : ""}`
      }
    >
      <span className="gs-ico" aria-hidden="true">
        <Icon />
      </span>
      <span>{item.label}</span>
      {pill && <span className="gs-pill">{pill}</span>}
    </NavLink>
  );
};

// Pull a short, friendly display name from the user. Prefers the
// signup `name` metadata, falls back to the email local-part, then
// "you" as last resort. Keeps it compact (first word + first
// initial-ish) so it fits the sidebar pill.
const userDisplayName = (user: { email?: string | null; user_metadata?: Record<string, unknown> }): string => {
  const meta = user.user_metadata as { name?: string } | undefined;
  const raw = meta?.name?.trim() ?? user.email?.split("@")[0] ?? "you";
  const first = raw.split(/\s+/)[0] ?? raw;
  return first.length > 12 ? `${first.slice(0, 11)}â€¦` : first;
};

// ============== ICONS - verbatim paths from Sidebar.html ==============

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
  // Four-petal flower in place of the old crossed-arrows icon.
  // The pollin8 brand mark for Match -- pollination over "fire."
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="1.6" />
      <path d="M8 1.6 C9.4 3 9.4 5 8 6.4 C6.6 5 6.6 3 8 1.6 Z" />
      <path d="M14.4 8 C13 9.4 11 9.4 9.6 8 C11 6.6 13 6.6 14.4 8 Z" />
      <path d="M8 14.4 C6.6 13 6.6 11 8 9.6 C9.4 11 9.4 13 8 14.4 Z" />
      <path d="M1.6 8 C3 6.6 5 6.6 6.4 8 C5 9.4 3 9.4 1.6 8 Z" />
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

function SavedIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2.5 H12 V13.5 L8 10.7 L4 13.5 Z" />
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

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 7.5 L8 2.5 L13.5 7.5 V13 a0.8 0.8 0 0 1 -0.8 0.8 H3.3 a0.8 0.8 0 0 1 -0.8 -0.8 Z" />
      <path d="M6.5 13.8 V9.5 H9.5 V13.8" />
    </svg>
  );
}

function SignInIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 2.5 H12.5 a1 1 0 0 1 1 1 V12.5 a1 1 0 0 1 -1 1 H9" />
      <path d="M2.5 8 H10" />
      <path d="M7.5 5.5 L10 8 L7.5 10.5" />
    </svg>
  );
}

function SignUpIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="6" r="2.5" />
      <path d="M2 13 c0 -2.2 1.8 -4 4 -4 s4 1.8 4 4" />
      <path d="M12.5 5 V9" />
      <path d="M10.5 7 H14.5" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.5 4.5 a2 2 0 1 0 -2.8 2.8 l-4.2 4.2 v1.5 h1.5 l4.2 -4.2 a2 2 0 0 0 2.8 -2.8 z" />
      <circle cx="9.5" cy="5.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 2.5 H3.5 a1 1 0 0 0 -1 1 V12.5 a1 1 0 0 0 1 1 H7" />
      <path d="M13.5 8 H6" />
      <path d="M11 5.5 L13.5 8 L11 10.5" />
    </svg>
  );
}
