import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

type Props = {
  children: ReactNode;
  /**
   * Used to be a CSS filter on <main>; that bug caused the AuthGate
   * (which is rendered as a CHILD of children) to inherit the blur
   * and become illegible. Visual blur/dim is now handled by the
   * AuthGate's own backdrop, so this prop is a no-op kept for
   * source compatibility with existing call sites.
   */
  blurred?: boolean;
};

/**
 * Common chrome for authenticated app pages: left sidebar + content
 * column that slides as the sidebar collapses + footer at the bottom.
 */
export const AppLayout = ({ children }: Props) => (
  <div className="min-h-screen bg-background text-foreground">
    <Sidebar />
    <div
      className="transition-[padding] duration-300"
      style={{ paddingLeft: "var(--sidebar-width, 240px)" }}
    >
      <main className="pt-12 pb-24">{children}</main>
      <Footer />
    </div>
  </div>
);
