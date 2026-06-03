import type { ReactNode } from "react";
import { AppLeftPanel } from "./AppLeftPanel";
import { AppRightRail } from "./AppRightRail";
import { ProfileSetupBanner } from "./ProfileSetupBanner";
import { MobileBottomNav } from "./MobileBottomNav";
import { Footer } from "./Footer";

type Props = {
 children: ReactNode;
 /**
 * Used to be a CSS filter on <main>; that bug caused the AuthGate
 * (which is rendered as a CHILD of children) to inherit the blur
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
 /**
 * Hide the desktop left-panel (Chats / Saved). Default off; pages
 * that need the entire viewport width (e.g. the in-conversation
 * /app/chats/:id detail) can opt out so the panel doesn't
 * double-render with the page's own thread list.
 */
 hideLeftPanel?: boolean;
};

/**
 * Common chrome for authenticated app pages.
 *
 * Desktop layout, left -> right:
 *   1. AppLeftPanel - persistent Chats/Saved column (~1/4 viewport,
 *      collapsible via vertical pill). Sets --left-panel-width.
 *   2. Main content column - pads past the panel and the right rail.
 *   3. AppRightRail - thin vertical rail on the far right with two
 *      icons (Match / Profile). Sets --right-rail-width.
 *
 * The old left Sidebar was removed from /app/ - its nav items
 * (Match, Profile, Settings, Admin, Sign out, Upgrade) collapse to
 * the right-rail's Match icon and to inside the Profile page.
 *
 * Mobile keeps the existing single-column layout + bottom tab bar;
 * AppLeftPanel and AppRightRail are hidden on small viewports via
 * their own md: classes.
 *
 * `min-h-dvh` uses the *dynamic* viewport unit so the layout stays
 * pinned to the visible area as mobile browser chrome animates
 * in/out, rather than leaving the white strip a static `100vh` would.
 */
export const AppLayout = ({
 children,
 hideBottomNav = false,
 hideLeftPanel = false,
}: Props) => (
 <div className="min-h-dvh bg-background text-foreground">
 <ProfileSetupBanner />
 {!hideLeftPanel && <AppLeftPanel />}
 <AppRightRail />
 <div
 className="transition-[padding] duration-300"
 style={{
 // Left padding covers the persistent chats/saved panel;
 // right padding covers the always-present rail. Both
 // variables fall through to 0 on mobile where neither
 // component renders.
 paddingLeft: hideLeftPanel
 ? "0"
 : "var(--left-panel-width, 0px)",
 paddingRight: "var(--right-rail-width, 0px)",
 // Top padding so the page content clears the
 // ProfileSetupBanner when it is visible (banner sets
 // --profile-banner-height; otherwise it's 0).
 paddingTop: "var(--profile-banner-height, 0px)",
 }}
 >
 <main className="pt-12 pb-24">{children}</main>
 <Footer />
 </div>
 {!hideBottomNav && <MobileBottomNav />}
 </div>
);
