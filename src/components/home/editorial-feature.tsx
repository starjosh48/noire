import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";

const principles = [
  {
    title: "Composed with restraint",
    body: "Each fragrance is built around a few exceptional materials, so it reads clearly on skin rather than shouting across a room.",
  },
  {
    title: "Made to be worn",
    body: "Every formula is tested in Lagos heat and humidity, tuned to last from morning meetings to late dinners.",
  },
  {
    title: "Honest by design",
    body: "Every note listed in full, clear concentrations, and no fragrance released until it is ready.",
  },
];

export function EditorialFeature() {
  return (
    <section aria-labelledby="editorial-title" className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div className="relative aspect-[4/5] overflow-hidden bg-stone">
        <Image
          src="/images/editorial/atelier.webp"
          alt="Three NOIRÉ flacons in different sizes in soft afternoon light"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="max-w-xl">
        <p className="eyebrow text-muted">The NOIRÉ philosophy</p>
        <h2 id="editorial-title" className="display mt-4 text-[44px] md:text-[64px]">
          Fragrance is more than a scent.
        </h2>
        <p className="mt-6 text-[16px] leading-relaxed text-ink-soft">
          It is the room you walk into before you arrive, and the memory that stays after you leave. We make
          fragrances that feel personal rather than performed: quiet, considered and entirely your own.
        </p>
        <dl className="mt-10 flex flex-col divide-y divide-line border-y border-line">
          {principles.map((p) => (
            <div key={p.title} className="py-5">
              <dt className="font-serif text-[22px]">{p.title}</dt>
              <dd className="mt-1.5 text-[14px] leading-relaxed text-muted">{p.body}</dd>
            </div>
          ))}
        </dl>
        <Link
          href="/about"
          className="mt-8 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-ink link-underline"
        >
          Read our story <ArrowRightIcon size={16} />
        </Link>
      </div>
    </section>
  );
}
