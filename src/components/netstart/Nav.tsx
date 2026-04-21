import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

export const Nav = () => (
  <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-background/60 border-b border-gold-soft">
    <div className="container flex h-16 items-center justify-between">
      <Logo />
      <nav className="hidden md:flex items-center gap-10 text-sm text-muted-foreground">
        <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
        <a href="#builders" className="hover:text-foreground transition-colors">Builders</a>
        <a href="#standards" className="hover:text-foreground transition-colors">Standards</a>
      </nav>
      <div className="flex items-center gap-3">
        <button className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</button>
        <Button variant="gold" size="sm">Request access</Button>
      </div>
    </div>
  </header>
);
