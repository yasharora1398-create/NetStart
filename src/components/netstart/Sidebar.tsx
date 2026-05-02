import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  Layers,
  LogIn,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { listNotifications } from "@/lib/mynet-storage";
import { getSupabase } from "@/lib/supabase";

type Item = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export const Sidebar = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const [unreadChats, setUnreadChats] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const asideRef = useRef<HTMLElement>(null);

  // Sidebar position is static — only the frosted-glass reflection
  // moves. The blue specular highlight sweeps top-to-bottom with page
  // scroll and tracks the mouse horizontally on hover.
  useEffect(() => {
    const el = asideRef.current;
    if (!el) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const docMax = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const t = Math.min(1, Math.max(0, window.scrollY / docMax));
      el.style.setProperty("--reflect-y", `${-10 + t * 120}%`);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(apply);
    };
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      el.style.setProperty("--reflect-x", `${Math.max(0, Math.min(100, x))}%`);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadChats(0);
      setUnreadNotifs(0);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      try {
        const list = await listNotifications();
        if (cancelled) return;
        setUnreadChats(
          list.filter((n) => n.type === "chat_request" && !n.readAt).length,
        );
        setUnreadNotifs(list.filter((n) => !n.readAt).length);
      } catch {
        // silent
      }
    };
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [user, location.pathname]);

  const items: Item[] = [
    { to: "/mynet", label: "MyNet", icon: User },
    { to: "/match", label: "Match", icon: Sparkles },
    { to: "/talent", label: "Talent", icon: Search },
    {
      to: "/chats",
      label: "Chats",
      icon: MessageCircle,
      badge: unreadChats || undefined,
    },
  ];
  if (isAdmin) {
    items.push({ to: "/admin", label: "Admin", icon: ShieldCheck });
  }

  const handleSignOut = async () => {
    try {
      await getSupabase().auth.signOut();
      window.location.href = "/";
    } catch {
      // noop
    }
  };

  return (
    <aside
      ref={asideRef}
      className={`fixed left-3 z-40 glass rounded-2xl flex flex-col transition-[width] duration-300 ${
        collapsed ? "w-14" : "w-56"
      }`}
      style={{
        top: "50%",
        transform: "translateY(-50%)",
        maxHeight: "calc(100vh - 1.5rem)",
      }}
    >
      {/* Top: brand + toggle */}
      <div className="relative flex items-center px-3 h-14 border-b border-white/10">
        {!collapsed && (
          <Link
            to="/"
            className="font-display text-base ml-1 mr-auto text-foreground"
          >
            netstart
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 text-muted-foreground hover:text-foreground hover:border-blue-400/40 hover:bg-white/5 transition-colors ${
            collapsed ? "mx-auto" : ""
          }`}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Sign in / Sign up at top for visitors */}
      <nav className="relative flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {!user && (
          <>
            <NavItem
              to="/signin"
              label="Sign in"
              Icon={LogIn}
              collapsed={collapsed}
            />
            <NavItem
              to="/signup"
              label="Sign up"
              Icon={User}
              collapsed={collapsed}
            />
            <Sep />
          </>
        )}

        {/* App pages — always visible */}
        <SectionLabel collapsed={collapsed}>App</SectionLabel>
        {items.map((item) => (
          <NavItem
            key={item.to}
            to={item.to}
            label={item.label}
            Icon={item.icon}
            collapsed={collapsed}
            badge={item.badge}
          />
        ))}

        <Sep />

        <SectionLabel collapsed={collapsed}>About</SectionLabel>
        <NavItem
          to="/how"
          label="How it works"
          Icon={Compass}
          collapsed={collapsed}
        />
        <NavItem
          to="/standards"
          label="Standards"
          Icon={Layers}
          collapsed={collapsed}
        />
        <NavItem
          to="/download"
          label="Download"
          Icon={Download}
          collapsed={collapsed}
        />
      </nav>

      {/* Bottom */}
      {user && (
        <div className="relative px-2 py-3 border-t border-white/10 space-y-0.5">
          <NavItem
            to="/chats"
            label="Notifications"
            Icon={Bell}
            collapsed={collapsed}
            badge={unreadNotifs || undefined}
            hideWhenActiveOn={["/chats"]}
          />
          <NavItem
            to="/settings"
            label="Settings"
            Icon={Settings}
            collapsed={collapsed}
          />
          <button
            type="button"
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span className="text-sm">Sign out</span>}
          </button>
        </div>
      )}
    </aside>
  );
};

const Sep = () => <div className="h-px bg-white/8 my-2 mx-2" />;

const SectionLabel = ({
  children,
  collapsed,
}: {
  children: React.ReactNode;
  collapsed: boolean;
}) => {
  if (collapsed) return null;
  return (
    <p className="px-3 mt-1 mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/50">
      {children}
    </p>
  );
};

const AnchorItem = ({
  hash,
  label,
  Icon,
  collapsed,
}: {
  hash: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
}) => {
  const location = useLocation();
  const onLanding = location.pathname === "/";
  const handleClick = (e: React.MouseEvent) => {
    if (!onLanding) return;
    e.preventDefault();
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <a
      href={onLanding ? `#${hash}` : `/#${hash}`}
      onClick={handleClick}
      title={collapsed ? label : undefined}
      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors ${
        collapsed ? "justify-center" : ""
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span className="text-sm flex-1">{label}</span>}
    </a>
  );
};

const NavItem = ({
  to,
  label,
  Icon,
  collapsed,
  badge,
  hideWhenActiveOn,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  badge?: number;
  hideWhenActiveOn?: string[];
}) => {
  const location = useLocation();
  if (hideWhenActiveOn?.includes(location.pathname)) return null;
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? "bg-blue-500/15 text-blue-300"
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
        } ${collapsed ? "justify-center" : ""}`
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span className="text-sm flex-1">{label}</span>}
      {badge != null && badge > 0 && (
        <span
          className={`${
            collapsed ? "absolute -top-1 -right-1" : ""
          } h-4 min-w-4 px-1 rounded-full bg-blue-500 text-white text-[10px] font-mono font-semibold flex items-center justify-center`}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </NavLink>
  );
};
