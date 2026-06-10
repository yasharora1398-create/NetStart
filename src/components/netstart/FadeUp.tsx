/**
 * Wraps content with an IntersectionObserver-driven reveal that
 * runs the moment the wrapper enters the viewport. Cheap and
 * doesn't need a library - we just toggle classes.
 *
 * Pages on the marketing surface stack a lot of sections, and a
 * staggered reveal as the user scrolls gives the page a sense of
 * momentum without being showy.
 *
 * `from` picks the entrance direction: "up" (default), "left",
 * "right", or "scale" (rises + grows). The VISIBLE state carries no
 * transform utilities at all - important because a transformed
 * ancestor becomes the containing block for position:fixed children
 * (the interactive demo's fullscreen overlay lives inside one of
 * these wrappers).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  /** Delay before the reveal kicks off, in ms. Use to stagger
   * siblings without nesting more wrappers. */
  delay?: number;
  /** Entrance direction/style. */
  from?: "up" | "left" | "right" | "scale";
  /** Transition length; longer reads as more deliberate. */
  durationMs?: number;
  className?: string;
};

const HIDDEN: Record<NonNullable<Props["from"]>, string> = {
  up: "opacity-0 translate-y-8",
  left: "opacity-0 -translate-x-10",
  right: "opacity-0 translate-x-10",
  scale: "opacity-0 translate-y-6 scale-95",
};

export const FadeUp = ({
  children,
  delay = 0,
  from = "up",
  durationMs = 700,
  className,
}: Props) => {
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
      style={{
        transitionDelay: visible ? `${delay}ms` : "0ms",
        transitionDuration: `${durationMs}ms`,
      }}
      className={cn(
        "transition-all ease-out",
        visible ? "opacity-100" : HIDDEN[from],
        className,
      )}
    >
      {children}
    </div>
  );
};
