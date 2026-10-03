"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** Horizontally scrolling, snap-aligned row with previous/next controls. */
export function ProductRail({ children, label }: { children: ReactNode; label: string }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scroll = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const control =
    "flex size-11 items-center justify-center border border-line text-ink transition-colors hover:border-ink disabled:border-line disabled:text-faint disabled:hover:border-line";

  return (
    <div className="relative">
      <div className="absolute -top-16 right-0 hidden gap-2 md:flex">
        <button type="button" className={control} onClick={() => scroll(-1)} disabled={!canPrev} aria-label={`Previous ${label}`}>
          <ArrowLeftIcon size={18} />
        </button>
        <button type="button" className={control} onClick={() => scroll(1)} disabled={!canNext} aria-label={`Next ${label}`}>
          <ArrowRightIcon size={18} />
        </button>
      </div>
      <ul
        ref={trackRef}
        aria-label={label}
        className={cn(
          "-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 md:-mx-8 md:gap-6 md:scroll-px-8 md:px-8 xl:-mx-14 xl:scroll-px-14 xl:px-14",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {Children.map(children, (child) => (
          <li className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[34%] lg:w-[26%] xl:w-[23%]">{child}</li>
        ))}
      </ul>
    </div>
  );
}
