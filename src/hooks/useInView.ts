import { RefObject, useEffect, useRef, useState } from "react";

interface Options {
 /** Viewport fraction to consider "in view". 0.25 = 25% visible. */
 threshold?: number;
 /** Only fire once (don't re-animate on scroll-out/back). Default true. */
 once?: boolean;
 /** Root margin, e.g. "-10% 0px". */
 rootMargin?: string;
 /** Optional custom scroll container (defaults to the viewport). */
 root?: RefObject<Element | null> | Element | null;
}

export function useInView<T extends HTMLElement>({
 threshold = 0.2,
 once = true,
 rootMargin = "0px 0px -10% 0px",
 root,
}: Options = {}) {
 const ref = useRef<T | null>(null);
 const [inView, setInView] = useState(false);

 useEffect(() => {
 const el = ref.current;
 if (!el) return;

 if (typeof IntersectionObserver === "undefined") {
 setInView(true);
 return;
 }

 const rootEl =
 root && typeof (root as RefObject<Element | null>).current !== "undefined"
 ? (root as RefObject<Element | null>).current
 : (root as Element | null) ?? null;

 const observer = new IntersectionObserver(
 ([entry]) => {
 if (entry.isIntersecting) {
 setInView(true);
 if (once) observer.disconnect();
 } else if (!once) {
 setInView(false);
 }
 },
 { threshold, rootMargin, root: rootEl },
 );

 observer.observe(el);
 return () => observer.disconnect();
 }, [threshold, once, rootMargin, root]);

 return { ref, inView } as const;
}
