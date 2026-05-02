import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  width: number;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

// Floating sidebar: width includes the 12px left/right margins so the
// content column sits just past the sidebar's right edge.
const COLLAPSED_W = 80;
const EXPANDED_W = 248;
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

  // Drive a global --scroll-progress (0..1) that .glass::before
  // reads to modulate edge reflections — the only thing that should
  // visibly react to page scroll on liquid-glass surfaces.
  useEffect(() => {
    let raf = 0;
    const apply = () => {
      raf = 0;
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const t = Math.min(1, Math.max(0, window.scrollY / max));
      document.documentElement.style.setProperty(
        "--scroll-progress",
        t.toFixed(4),
      );
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", apply);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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
