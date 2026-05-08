import { createContext, useContext, useEffect, type ReactNode } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  width: number;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

// Sidebar is fixed at 224px + 12px left margin + 12px gap = 248px of
// horizontal space pages should pad past. There's no collapse anymore;
// `collapsed` and `setCollapsed` remain on the context as no-ops so any
// older callers compile, but the value is constant.
//
// The actual --sidebar-width CSS variable is written by the Sidebar
// component on mount (and removed on unmount), so pages that pad past
// the sidebar via `var(--sidebar-width, 0px)` collapse to zero padding
// when no sidebar is rendered (e.g. production /mynet).
const SIDEBAR_WIDTH = 248;

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  // Drive a global --scroll-progress (0..1) that .glass::before reads
  // to modulate edge reflections on liquid-glass surfaces elsewhere on
  // the page (mockup cards, etc.). The fixed sidebar has its own static
  // chromatic edge and doesn't depend on this.
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
        collapsed: false,
        setCollapsed: () => {
          // noop — collapse no longer supported
        },
        width: SIDEBAR_WIDTH,
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
      width: SIDEBAR_WIDTH,
    };
  }
  return ctx;
};
