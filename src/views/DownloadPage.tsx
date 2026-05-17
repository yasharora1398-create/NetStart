"use client";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/lib/router-compat";
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
      <div className="max-w-4xl mx-auto px-6 md:px-10 pt-6 pb-20 md:pt-10 md:pb-24">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary mb-5">
            Download
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-[6rem] tracking-[-0.04em] leading-[0.92] mb-8 max-w-3xl">
            Builders,<br />
            <span className="text-primary">not talkers.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-12 leading-relaxed">
            Native apps for iOS and Android. The web works too. The
            phone is where the swiping lives.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="grid sm:grid-cols-2 gap-3 max-w-md mb-20">
            <div
              aria-disabled="true"
              className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border opacity-70 cursor-not-allowed select-none"
            >
              <Apple className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Coming soon
                </p>
                <p className="font-display text-base text-muted-foreground">
                  iOS
                </p>
              </div>
            </div>
            <div
              aria-disabled="true"
              className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border opacity-70 cursor-not-allowed select-none"
            >
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Coming soon
                </p>
                <p className="font-display text-base text-muted-foreground">
                  Android
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 pt-10 border-t border-border">
            {[
              { label: "iOS", body: "iOS 16+. Native UIKit." },
              { label: "Android", body: "Android 12+. Material 3." },
              { label: "Web", body: "Chrome, Safari, Firefox latest." },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary mb-2">
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
          <div className="mt-20 pt-10 border-t border-border">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 text-base font-medium text-primary transition-colors hover:opacity-80"
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
