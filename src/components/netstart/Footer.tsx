import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="border-t border-border bg-background">
    <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
      <p>© {new Date().getFullYear()} NetStart</p>
      <nav className="flex items-center gap-6">
        <Link to="/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">
          Privacy
        </Link>
        <a
          href="mailto:NetStartapp@outlook.com"
          className="hover:text-foreground transition-colors"
        >
          Contact
        </a>
      </nav>
    </div>
  </footer>
);
