import { NavLink as RRNavLink, useLocation } from "react-router-dom";
import { Flower2, Heart, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Discover", icon: Flower2 },
  { to: "/matches", label: "Matches", icon: Heart },
  { to: "/messages", label: "Chats", icon: MessageCircle },
  { to: "/profile", label: "Me", icon: User },
];

export const BottomNav = () => {
  const location = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-3 left-1/2 z-40 w-[min(420px,calc(100%-1.5rem))] -translate-x-1/2 rounded-full border-2 border-foreground bg-background/95 shadow-pop-white backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch justify-around px-2 py-1.5">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <li key={to} className="flex-1">
              <RRNavLink
                to={to}
                className="group flex flex-col items-center justify-center gap-0.5 py-1.5"
                aria-label={label}
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full transition-all",
                    active
                      ? "bg-primary text-primary-foreground border-2 border-foreground -rotate-6"
                      : "text-foreground/60 group-hover:text-foreground"
                  )}
                >
                  <Icon
                    className="h-5 w-5"
                    fill={active ? "currentColor" : "none"}
                    strokeWidth={active ? 2 : 1.75}
                  />
                </span>
                <span
                  className={cn(
                    "text-[9px] font-black uppercase tracking-wider transition-colors",
                    active ? "text-foreground" : "text-foreground/50"
                  )}
                >
                  {label}
                </span>
              </RRNavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
