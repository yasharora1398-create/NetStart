import { Link } from "@/lib/router-compat";

export const Footer = () => (
  <footer className="border-t border-border bg-background">
    <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
      <p>© {new Date().getFullYear()} Polln8</p>
      <nav className="flex items-center gap-6">
        <Link to="/about" className="hover:text-foreground transition-colors">
          About
        </Link>
        <Link to="/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">
          Privacy
        </Link>
        <a
          href="mailto:Polln8app@outlook.com"
          className="hover:text-foreground transition-colors"
        >
          Contact
        </a>
      </nav>
    </div>
  </footer>
);
