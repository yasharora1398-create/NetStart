/**
 * Wraps content with an IntersectionObserver-driven fade-up that
 * runs the moment the wrapper enters the viewport. Cheap and
 * doesn't need a library - we just toggle a class.
 *
 * Pages on the marketing surface stack a lot of sections, and a
 * subtle staggered fade as the user scrolls gives the page a
 * sense of momentum without being showy.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  /** Delay before the fade kicks off, in ms. Use to stagger
   *  siblings without nesting more wrappers. */
  delay?: number;
  className?: string;
};

export const FadeUp = ({ children, delay = 0, className }: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Respect prefers-reduced-motion - skip the animation and just
    // show the content.
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -64px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={cn(
        "transition-all duration-700 ease-out",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4",
        className,
      )}
    >
      {children}
    </div>
  );
};
