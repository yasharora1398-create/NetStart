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
          <section className="pt-6 md:pt-10 pb-20 md:pb-24">
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
            <div className="flex items-center gap-6 mb-12">
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

          {/* PULL QUOTE — large, asymmetric, the "what we believe" */}
          <section className="border-t border-white/10 py-20 md:py-28 relative">
            <div className="absolute left-0 top-12 font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400">
              ¶ Standards
            </div>
            <blockquote className="max-w-4xl pl-0 md:pl-24">
              <p className="font-display text-3xl md:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.04em]">
                We <span className="text-blue-400">vet for shipped work</span>,
                match on capability, and make every action decisive.{" "}
                <span className="text-muted-foreground">
                  The network shrinks if it has to.
                </span>
              </p>
              <Link
                to="/standards"
                className="group inline-flex items-center gap-2 mt-10 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
              >
                Read the rules
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </blockquote>
          </section>

          {/* FLOW — horizontal stepper with chevrons */}
          <section className="border-t border-white/10 py-20 md:py-28">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-8">
              How it works
            </p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 font-display text-3xl md:text-5xl lg:text-6xl tracking-[-0.04em] leading-[1]">
              <Step n="01">Sign up</Step>
              <Arrow />
              <Step n="02">Verify</Step>
              <Arrow />
              <Step n="03">Match</Step>
              <Arrow />
              <Step n="04" highlight>
                Build
              </Step>
            </div>
            <Link
              to="/how"
              className="group inline-flex items-center gap-2 mt-10 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors"
            >
              Walk through it
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </section>

          {/* DOWNLOAD — frosted glass card */}
          <section className="py-16 md:py-20">
            <div
              className="glass rounded-2xl p-8 md:p-12"
              style={{ fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif" }}
            >
              <div className="grid md:grid-cols-[1fr_auto] gap-10 md:gap-16 items-end">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-4 inline-flex items-center gap-2">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        background: "#3a7bff",
                        boxShadow: "0 0 8px rgba(58,123,255,0.55)",
                      }}
                    />
                    Download
                  </p>
                  <h2
                    className="text-4xl md:text-6xl tracking-[-0.04em] leading-[0.98] mb-3"
                    style={{ fontWeight: 600 }}
                  >
                    Operators,
                    <br />
                    <span className="text-muted-foreground">not talkers.</span>
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground max-w-md leading-relaxed">
                    Native apps for iOS and Android. The phone is where the
                    swiping lives.
                  </p>
                </div>
                <div className="flex flex-col gap-2.5">
                  <DownloadButton primary label="Download for iOS" sub="Requires iOS 16+" />
                  <DownloadButton label="Get it on Android" sub="Requires Android 12+" />
                </div>
              </div>
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

const Step = ({
  n,
  children,
  highlight = false,
}: {
  n: string;
  children: React.ReactNode;
  highlight?: boolean;
}) => (
  <span className="inline-flex items-baseline gap-2">
    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-blue-400/70 align-top">
      {n}
    </span>
    <span className={highlight ? "text-blue-400" : ""}>{children}</span>
  </span>
);

const Arrow = () => (
  <span
    aria-hidden
    className="text-muted-foreground/40 font-display text-3xl md:text-5xl lg:text-6xl tracking-[-0.04em] leading-[1]"
  >
    /
  </span>
);

const CTA =
  "group inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors";
const MUTE =
  "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors";

const DownloadButton = ({
  label,
  sub,
  primary = false,
}: {
  label: string;
  sub: string;
  primary?: boolean;
}) => (
  <a
    href="#"
    className="group inline-flex items-center gap-3 rounded-xl px-5 py-3 transition-all min-w-[220px]"
    style={
      primary
        ? {
            background:
              "linear-gradient(180deg, #4a86ff 0%, #2f6fff 100%)",
            color: "#fff",
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.25) inset, 0 -8px 16px rgba(0,0,0,0.18) inset, 0 6px 20px rgba(58,123,255,0.35), 0 1px 2px rgba(0,0,0,0.4)",
          }
        : {
            background: "rgba(255,255,255,0.04)",
            color: "#eef1f6",
            border: "0.5px solid rgba(255,255,255,0.14)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset",
          }
    }
  >
    <span
      className="text-sm font-medium block flex-1"
      style={{ fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif" }}
    >
      <span className="block leading-tight">{label}</span>
      <span
        className="block text-[10px] font-mono uppercase tracking-[0.18em] opacity-60 mt-0.5"
        style={{
          fontFamily:
            "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        {sub}
      </span>
    </span>
    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
  </a>
);

export default Index;
