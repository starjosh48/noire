"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades its content up once, the first time it scrolls into view. Purely decorative: content
 * is visible without JavaScript (see the <noscript> rule in the root layout) and with
 * reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.reveal = "visible";
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = "visible";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal="" className={className} style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}>
      {children}
    </div>
  );
}
