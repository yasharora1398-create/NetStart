import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ overflowX: "clip" }}
    >
      <Sidebar />
      <div
        className="transition-[padding] duration-300"
        style={{ paddingLeft: "var(--sidebar-width, 248px)" }}
      >
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          {/* HERO */}
          <section className="pt-6 md:pt-10 pb-16 md:pb-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-5">
              netstart / for builders
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-[6.25rem] leading-[0.92] tracking-[-0.04em] mb-6 max-w-4xl">
              The mobile app for people who actually
              <span className="text-blue-400"> build.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
              A network for founders and operators who ship.
            </p>
            <div className="flex items-center gap-6 mb-10">
              {user ? (
                <Link to="/mynet" className={CTA}>
                  Open MyNet
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <>
                  <Link to="/signup" className={CTA}>
                    Sign up
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link to="/signin" className={MUTE}>
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <div className="flex gap-x-10 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              <span>
                <span className="text-foreground">2,840</span> verified
              </span>
              <span>
                <span className="text-foreground">312</span> companies
              </span>
            </div>
          </section>

          {/* STANDARDS — terse three-line statement */}
          <section className="border-t border-white/10 py-12 md:py-16">
            <div className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12">
              <Link
                to="/standards"
                className="group inline-flex items-start gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Standards
                <ArrowRight className="h-3 w-3 mt-0.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="font-display text-2xl md:text-4xl tracking-[-0.03em] leading-[1.15] max-w-3xl">
                Vetted, not viral.{" "}
                <span className="text-muted-foreground">
                  Skill, not surface.
                </span>{" "}
                Decisive,{" "}
                <span className="text-muted-foreground">by design.</span>
              </p>
            </div>
          </section>

          {/* HOW IT WORKS — single line */}
          <section className="border-t border-white/10 py-12 md:py-16">
            <div className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12">
              <Link
                to="/how"
                className="group inline-flex items-start gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 hover:text-blue-300 transition-colors"
              >
                How it works
                <ArrowRight className="h-3 w-3 mt-0.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="font-display text-2xl md:text-4xl tracking-[-0.03em] leading-[1.15] max-w-3xl">
                Sign up. Verify. Match.{" "}
                <span className="text-blue-400">Build.</span>
              </p>
            </div>
          </section>

          {/* DOWNLOAD */}
          <section className="border-t border-white/10 py-12 md:py-16">
            <div className="grid md:grid-cols-[140px_1fr] gap-6 md:gap-12">
              <Link
                to="/download"
                className="group inline-flex items-start gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Download
                <ArrowRight className="h-3 w-3 mt-0.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="font-display text-2xl md:text-4xl tracking-[-0.03em] leading-[1.15] max-w-3xl">
                Operators,{" "}
                <span className="text-muted-foreground">not talkers.</span>{" "}
                <span className="text-blue-400">iOS &amp; Android.</span>
              </p>
            </div>
          </section>

          <footer className="border-t border-white/10 mt-4 mb-6 pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            <p>© netstart</p>
            <div className="flex gap-6">
              <Link to="/how" className="hover:text-foreground transition-colors">
                How it works
              </Link>
              <Link
                to="/standards"
                className="hover:text-foreground transition-colors"
              >
                Standards
              </Link>
              <Link
                to="/download"
                className="hover:text-foreground transition-colors"
              >
                Download
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

const CTA =
  "group inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors";
const MUTE =
  "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors";

export default Index;
