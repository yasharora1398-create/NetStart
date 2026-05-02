import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  width: number;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

const COLLAPSED_W = 64;
const EXPANDED_W = 240;
const LS_KEY = "netstart_sidebar_collapsed";

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(LS_KEY) === "1";
  });

  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    try {
      window.localStorage.setItem(LS_KEY, v ? "1" : "0");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${collapsed ? COLLAPSED_W : EXPANDED_W}px`,
    );
  }, [collapsed]);

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        width: collapsed ? COLLAPSED_W : EXPANDED_W,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextValue => {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    return {
      collapsed: false,
      setCollapsed: () => {
        // noop fallback
      },
      width: EXPANDED_W,
    };
  }
  return ctx;
};
