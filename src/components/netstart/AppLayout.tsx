import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { Footer } from "./Footer";

type Props = {
 children: ReactNode;
 /**
 * Used to be a CSS filter on <main>; that bug caused the AuthGate
 * (which is rendered as a CHILD of children) to inherit the
 * and become illegible. Visual /dim is now handled by the
 * AuthGate's own backdrop, so this prop is a no-op kept for
 * source compatibility with existing call sites.
 */
 blurred?: boolean;
 /**
 * Hide the mobile bottom tab bar for pages that aren't part of
 * the core app loop (e.g. /perks - it's a marketing surface
 * accessed from the hamburger menu, not a tab in its own right).
 */
 hideBottomNav?: boolean;
};

/**
 * Common chrome for authenticated app pages: left sidebar (desktop)
 * or bottom tab bar (mobile) + content column + footer.
 *
 * `min-h-dvh` uses the *dynamic* viewport unit so the layout stays
 * pinned to the visible area as mobile browser chrome animates
 * in/out, rather than leaving the white strip a static `100vh` would.
 */
export const AppLayout = ({ children, hideBottomNav = false }: Props) => (
 <div className="min-h-dvh bg-background text-foreground">
 <Sidebar />
 <div
 className="transition-[padding] duration-300"
 style={{ paddingLeft: "var(--sidebar-width, 240px)" }}
 >
 <main className="pt-12 pb-24">{children}</main>
 <Footer />
 </div>
 {!hideBottomNav && <MobileBottomNav />}
 </div>
);
