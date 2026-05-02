import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

type Props = {
  children: ReactNode;
  /** Apply blur+lock to the main area. Used while not authed. */
  blurred?: boolean;
};

/**
 * Common chrome for authenticated app pages: left sidebar + content
 * column that slides as the sidebar collapses + footer at the bottom.
 */
export const AppLayout = ({ children, blurred = false }: Props) => (
  <div className="min-h-screen bg-background text-foreground">
    <Sidebar />
    <div
      className="transition-[padding] duration-300"
      style={{ paddingLeft: "var(--sidebar-width, 240px)" }}
    >
      <main
        className={`pt-12 pb-24 ${
          blurred ? "pointer-events-none select-none blur-sm" : ""
        }`}
      >
        {children}
      </main>
      <Footer />
    </div>
  </div>
);
