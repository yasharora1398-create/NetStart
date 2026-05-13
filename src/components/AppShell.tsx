import { ReactNode } from "react";
import { useLocation } from "@/lib/router-compat";
import { BottomNav } from "./BottomNav";
import { Logo } from "./Logo";
import { StatusBar } from "./PhoneChrome";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  rightSlot?: ReactNode;
  showLogo?: boolean;
  /** When true, main is a flex column that fills remaining height (good for swipe deck) */
  fillHeight?: boolean;
}

export const AppShell = ({ children, title, rightSlot, showLogo = false, fillHeight = false }: AppShellProps) => {
  const location = useLocation();
  return (
    <div className="min-h-[100dvh] bg-background text-foreground md:py-8">
      <div
        className="relative mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden animate-phone-spin-in [transform-origin:center_center] md:h-[min(92dvh,900px)] md:rounded-[52px] md:border-2 md:border-foreground/20 md:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),inset_0_0_0_6px_rgba(255,255,255,0.03)]"
      >
        <StatusBar />

        {/* iOS-style header */}
        {(title || showLogo) && (
          <header className="z-30 flex shrink-0 items-center justify-between border-b border-foreground/10 bg-background/85 px-5 pt-[max(env(safe-area-inset-top),2.25rem)] pb-3 backdrop-blur-xl">
            {showLogo ? <Logo size="md" /> : (
              <h1 className="font-display text-2xl font-black tracking-tight">{title}</h1>
            )}
            {rightSlot}
          </header>
        )}

        {/* Main - leaves room for floating nav (~88px) */}
        <main
          className={
            fillHeight
              ? "flex min-h-0 flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+92px)]"
              : "flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+92px)]"
          }
        >
          <div key={location.pathname} className="h-full animate-ios-rise">
            {children}
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
};
