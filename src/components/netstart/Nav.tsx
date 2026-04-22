import { Link, NavLink, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export const Nav = () => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const onLanding = location.pathname === "/";

  const handleLandingScroll = (id: string) => (e: React.MouseEvent) => {
    if (!onLanding) return;
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: id === "standards" ? "center" : "start",
    });
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-gold-soft">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" aria-label="NetStart home">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-10 text-sm text-muted-foreground">
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
            className={({ isActive }) =>
              `transition-colors ${
                isActive ? "text-gold" : "hover:text-foreground"
              }`
            }
          >
            MyNet
          </NavLink>
          {user && isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `transition-colors ${
                  isActive ? "text-gold" : "hover:text-foreground"
                }`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-3 min-h-9">
          {loading ? null : user ? (
            <UserMenu />
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
        </div>
      </div>
    </header>
  );
};
