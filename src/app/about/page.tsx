import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";

// Served from the edge cache; refreshed in the background at most every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "About us",
  description:
    "NOIRÉ is a modern fragrance house from Lagos, making considered eaux de parfum that feel personal rather than performed.",
  alternates: { canonical: "/about" },
};

const chapters = [
  {
    title: "Fewer, better materials",
    body: "Each NOIRÉ fragrance begins with a single idea (smoke on cedar, iris after dark, rain on warm stone) and a short list of materials chosen to express it. We would rather a fragrance be clear than complicated.",
  },
  {
    title: "Made for real days",
    body: "Our formulas are tested where our clients live: in heat, humidity and air conditioning, from early meetings to late dinners. Concentrations are set so a fragrance lasts without overwhelming the people around you.",
  },
  {
    title: "Neither feminine nor masculine",
    body: "Scent has no dress code. We describe our fragrances by character and mood, not by gender, and invite you to wear whatever feels like you.",
  },
  {
    title: "Transparent from top to base",
    body: "Every fragrance lists its full top, heart and base notes, its longevity and its sillage, so you know exactly what you are choosing before it arrives.",
  },
];

export default function AboutPage() {
  return (
    <div className="pb-24 md:pb-32">
      <header className="shell pt-10 md:pt-16">
        <p className="eyebrow text-muted">About NOIRÉ</p>
        <h1 className="display mt-3 max-w-5xl text-[52px] md:text-[104px]">Fragrance is more than a scent.</h1>
      </header>

      <div className="shell mt-14 grid gap-12 md:mt-20 lg:grid-cols-12 lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden bg-stone lg:col-span-6">
          <Image
            src="/images/editorial/atelier.webp"
            alt="NOIRÉ flacons in soft afternoon light"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center lg:col-span-5 lg:col-start-8">
          <p className="font-serif text-[28px] leading-snug text-ink md:text-[34px]">
            It is the room you walk into before you arrive, and the memory that stays after you leave.
          </p>
          <p className="mt-8 text-[16px] leading-relaxed text-ink-soft">
            NOIRÉ began in Lagos with a simple frustration: luxury fragrance felt either loud and anonymous or distant
            and intimidating. We wanted something in between: fragrances with the craft of a perfume house and the
            ease of something you reach for every morning.
          </p>
          <p className="mt-5 text-[16px] leading-relaxed text-ink-soft">
            Today the collection is twelve eaux de parfum, each in three sizes, each built around a single idea and
            described honestly, so finding your scent feels like discovery rather than guesswork.
          </p>
        </div>
      </div>

      <section aria-labelledby="principles" className="shell mt-24 md:mt-36">
        <h2 id="principles" className="eyebrow text-ink">
          What we believe
        </h2>
        <ol className="mt-8 grid gap-px bg-line md:grid-cols-2">
          {chapters.map((chapter, index) => (
            <li key={chapter.title} className="bg-ivory p-6 md:p-10">
              <span className="text-[12px] tabular-nums text-faint">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="display mt-4 text-[32px] md:text-[40px]">{chapter.title}</h3>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">{chapter.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="shell mt-24 text-center md:mt-36">
        <p className="display mx-auto max-w-3xl text-[40px] md:text-[60px]">Begin with the one that feels like you.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/shop" size="lg">
            Explore fragrances
          </ButtonLink>
          <ButtonLink href="/discovery" size="lg" variant="secondary">
            Discover your scent
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
