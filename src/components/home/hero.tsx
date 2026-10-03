import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="shell pt-6 md:pt-10">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6 lg:py-16 xl:col-span-5">
          <p className="eyebrow text-muted animate-fade">The NOIRÉ collection · Twelve eaux de parfum</p>
          <h1
            id="hero-title"
            className="display mt-6 text-[clamp(3.25rem,9vw,7.25rem)] animate-rise [animation-delay:80ms]"
          >
            Find the scent that <em className="italic">feels</em> like you.
          </h1>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-muted animate-rise [animation-delay:180ms] md:text-[17px]">
            Curated fragrances for every mood, moment, and memory.
          </p>
          <div className="mt-9 flex flex-col gap-3 animate-rise [animation-delay:260ms] sm:flex-row">
            <ButtonLink href="/shop" size="lg">
              Explore fragrances
            </ButtonLink>
            <ButtonLink href="/discovery" size="lg" variant="secondary">
              Discover your scent
            </ButtonLink>
          </div>
        </div>

        <figure className="relative lg:col-span-6 xl:col-span-7">
          <div className="relative aspect-[4/5] overflow-hidden bg-stone sm:aspect-[5/5] lg:aspect-[4/4.4]">
            <Image
              src="/images/editorial/hero.webp"
              alt="Three NOIRÉ flacons, Citrus Veil, Santal Obscur and Midnight Iris, on stone plinths in window light"
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-3 flex justify-between text-[11px] uppercase tracking-[0.16em] text-muted">
            <span>Left to right: 03 Citrus Veil, 01 Santal Obscur, 05 Midnight Iris</span>
            <span className="hidden sm:inline">Autumn edit</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
