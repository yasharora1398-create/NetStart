import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Apple, ArrowRight, Smartphone } from "lucide-react";
import { Sidebar } from "@/components/netstart/Sidebar";

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setOn(true),
      { threshold: 0.15 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, on] as const;
}

const Reveal = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const [ref, on] = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${on ? "reveal-on" : ""}`}
      style={{ transitionDelay: on ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

const DownloadPage = () => (
  <div
    className="min-h-screen bg-background text-foreground"
    style={{ overflowX: "clip" }}
  >
    <Sidebar />
    <div
      className="transition-[padding] duration-300"
      style={{ paddingLeft: "var(--sidebar-width, 248px)" }}
    >
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-20 md:py-28">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-blue-400 mb-5">
            Download
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-[6rem] tracking-[-0.04em] leading-[0.92] mb-8 max-w-3xl">
            Operators,<br />
            <span className="text-blue-400">not talkers.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-12 leading-relaxed">
            Native apps for iOS and Android. The web works too — but the
            phone is where the swiping lives.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="grid sm:grid-cols-2 gap-3 max-w-md mb-20">
            <a
              href="#"
              className="group flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all"
            >
              <Apple className="h-5 w-5 text-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Download on
                </p>
                <p className="font-display text-base">iOS</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
            <a
              href="#"
              className="group flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:bg-white/[0.07] hover:border-white/20 transition-all"
            >
              <Smartphone className="h-5 w-5 text-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Get it on
                </p>
                <p className="font-display text-base">Android</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </a>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 pt-10 border-t border-white/10">
            {[
              { label: "iOS", body: "iOS 16+. Native UIKit." },
              { label: "Android", body: "Android 12+. Material 3." },
              { label: "Web", body: "Chrome, Safari, Firefox latest." },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-blue-400 mb-2">
                  {s.label}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-20 pt-10 border-t border-white/10">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 text-base font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Or sign up on the web
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </div>
  </div>
);

export default DownloadPage;
