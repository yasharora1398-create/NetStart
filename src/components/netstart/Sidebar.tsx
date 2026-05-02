import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  Users,
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
        // silent — sidebar badges shouldn't toast
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
      className={`fixed left-0 top-0 bottom-0 z-40 border-r border-border bg-background flex flex-col transition-[width] duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo + toggle */}
      <div className="flex items-center px-3 h-16 border-b border-border">
        {!collapsed && (
          <Link
            to="/"
            className="font-display text-lg tracking-tight ml-1 mr-auto"
          >
            NetStart
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`h-8 w-8 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-blue-400/40 transition-colors ${
            collapsed ? "mx-auto" : ""
          }`}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {!user ? (
          <NavItem
            to="/signin"
            label="Sign in"
            Icon={User}
            collapsed={collapsed}
          />
        ) : (
          items.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              label={item.label}
              Icon={item.icon}
              collapsed={collapsed}
              badge={item.badge}
            />
          ))
        )}
      </nav>

      {/* Bottom: notifications + settings + sign out */}
      {user && (
        <div className="px-2 py-4 border-t border-border space-y-1">
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
            className={`w-full relative flex items-center gap-3 px-3 py-2.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-card border border-transparent transition-colors ${
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
        `relative flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors border ${
          isActive
            ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
            : "text-muted-foreground hover:text-foreground hover:bg-card border-transparent"
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
