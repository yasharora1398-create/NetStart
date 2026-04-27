import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";
import { NotificationsBell } from "./NotificationsBell";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { listNotifications } from "@/lib/mynet-storage";

export const Nav = () => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const onLanding = location.pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadChats(0);
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
      } catch {
        // silent — this is just a badge, don't toast
      }
    };
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [user, location.pathname]);

  const handleLandingScroll = (id: string) => (e: React.MouseEvent) => {
    setMobileOpen(false);
    if (!onLanding) return;
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: id === "standards" ? "center" : "start",
    });
  };

  const closeMobile = () => setMobileOpen(false);

  const navLinks = (
    <>
      <a
        href={onLanding ? "#how" : "/#how"}
        onClick={handleLandingScroll("how")}
        className="hover:text-foreground transition-colors"
      >
        How it works
      </a>
      <a
        href={onLanding ? "#standards" : "/#standards"}
        onClick={handleLandingScroll("standards")}
        className="hover:text-foreground transition-colors"
      >
        Standards
      </a>
      <a
        href={onLanding ? "#download" : "/#download"}
        onClick={handleLandingScroll("download")}
        className="hover:text-foreground transition-colors"
      >
        Download
      </a>
      <NavLink
        to="/mynet"
        onClick={closeMobile}
        className={({ isActive }) =>
          `transition-colors ${
            isActive ? "text-gold" : "hover:text-foreground"
          }`
        }
      >
        MyNet
      </NavLink>
      <NavLink
        to="/talent"
        onClick={closeMobile}
        className={({ isActive }) =>
          `transition-colors ${
            isActive ? "text-gold" : "hover:text-foreground"
          }`
        }
      >
        Talent
      </NavLink>
      {user && (
        <NavLink
          to="/match"
          onClick={closeMobile}
          className={({ isActive }) =>
            `transition-colors ${
              isActive ? "text-gold" : "hover:text-foreground"
            }`
          }
        >
          Match
        </NavLink>
      )}
      {user && isAdmin && (
        <NavLink
          to="/admin"
          onClick={closeMobile}
          className={({ isActive }) =>
            `transition-colors ${
              isActive ? "text-gold" : "hover:text-foreground"
            }`
          }
        >
          Admin
        </NavLink>
      )}
    </>
  );

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-gold-soft">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" aria-label="NetStart home">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-sm text-muted-foreground">
          {navLinks}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 min-h-9">
          {loading ? null : user ? (
            <>
              <NavLink
                to="/chats"
                aria-label="Chats"
                className={({ isActive }) =>
                  `relative h-9 w-9 flex items-center justify-center rounded-sm border transition-colors ${
                    isActive
                      ? "border-gold/60 text-gold bg-gold/5"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-gold/40"
                  }`
                }
              >
                <MessageCircle className="h-4 w-4" />
                {unreadChats > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-gold text-obsidian text-[10px] font-mono font-semibold flex items-center justify-center">
                    {unreadChats > 9 ? "9+" : unreadChats}
                  </span>
                )}
              </NavLink>
              <NotificationsBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Link
                to="/signin"
                className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link to="/signup">
                <Button variant="gold" size="sm">
                  Sign up
                </Button>
              </Link>
            </>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="md:hidden h-9 w-9 flex items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[80vw] sm:w-72 bg-background border-l border-gold-soft"
            >
              <SheetHeader className="mb-6">
                <SheetTitle className="font-display text-2xl text-left">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-5 text-base text-muted-foreground">
                {navLinks}
              </nav>
              {!user && !loading && (
                <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3">
                  <Link to="/signin" onClick={closeMobile}>
                    <Button variant="outlineGold" size="lg" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={closeMobile}>
                    <Button variant="gold" size="lg" className="w-full">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
