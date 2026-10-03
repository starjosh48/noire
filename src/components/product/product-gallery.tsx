"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { artwork } from "@/lib/images";
import { cn } from "@/lib/utils";

const captions = ["The flacon", "Still life", "Detail"];

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (index: number) => {
    const el = trackRef.current;
    el?.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  const alt = (index: number) => `${name}: ${captions[index]?.toLowerCase() ?? "image " + (index + 1)}`;

  return (
    <div>
      {/* Mobile & tablet: swipeable carousel */}
      <div className="relative lg:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="-mx-5 flex snap-x snap-mandatory overflow-x-auto md:-mx-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={`${name} images`}
          role="region"
          tabIndex={0}
        >
          {images.map((src, index) => (
            <div key={src} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-stone md:aspect-square">
              <Image
                src={artwork(src)}
                alt={alt(index)}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-current={active === index}
              className="flex h-6 items-center px-1"
            >
              <span
                className={cn(
                  "block h-px transition-[width,background-color] duration-500 ease-out-soft",
                  active === index ? "w-8 bg-ink" : "w-4 bg-sand",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: editorial stack */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        {images.map((src, index) => (
          <figure key={src} className={cn("relative bg-stone", index === 0 ? "col-span-2 aspect-[4/5]" : "aspect-[4/5]")}>
            <Image
              src={artwork(src)}
              alt={alt(index)}
              fill
              priority={index === 0}
              sizes={index === 0 ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 27vw, 50vw"}
              className="object-cover"
            />
          </figure>
        ))}
      </div>
    </div>
  );
}
