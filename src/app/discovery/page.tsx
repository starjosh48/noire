import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/icons";
import { parseFilters } from "@/lib/catalog/filters";
import { discoverProducts } from "@/lib/catalog/queries";
import { moods, scentProfiles } from "@/lib/catalog/taxonomy";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Find your signature scent",
  description:
    "Tell us the character you're drawn to and when you'll wear it. The NOIRÉ scent finder narrows twelve fragrances to the ones made for you.",
  alternates: { canonical: "/discovery" },
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function href(scents: string[], moments: string[]) {
  const params = new URLSearchParams();
  if (scents.length) params.set("scent", scents.join(","));
  if (moments.length) params.set("mood", moments.join(","));
  const qs = params.toString();
  return `/discovery${qs ? `?${qs}` : ""}#results`;
}

export default async function DiscoveryPage({ searchParams }: PageProps<"/discovery">) {
  const filters = parseFilters(await searchParams);
  const scents = filters.scent;
  const moments = filters.mood;
  const results = await discoverProducts(scents, moments);
  const hasSelection = scents.length + moments.length > 0;

  return (
    <div className="pb-24 md:pb-32">
      <header className="shell pt-10 md:pt-16">
        <p className="eyebrow text-muted">The scent finder</p>
        <h1 className="display mt-3 max-w-4xl text-[52px] md:text-[96px]">What kind of scent are you looking for?</h1>
        <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-muted">
          Choose as many characters as feel like you, then tell us when you&rsquo;ll wear it. Your matches update as you go.
        </p>
      </header>

      <section aria-labelledby="step-character" className="shell mt-14 md:mt-20">
        <h2 id="step-character" className="flex items-baseline gap-3">
          <span className="text-[12px] tabular-nums text-faint">01</span>
          <span className="eyebrow text-ink">The character</span>
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {scentProfiles.map((profile) => {
            const selected = scents.includes(profile.slug);
            return (
              <li key={profile.slug}>
                <Link
                  href={href(toggle(scents, profile.slug), moments)}
                  scroll={false}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "group relative flex h-full min-h-36 flex-col justify-between border p-5 transition-colors duration-300 md:min-h-44 md:p-6",
                    selected ? "border-ink bg-ink text-ivory" : "border-line bg-paper text-ink hover:border-ink",
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 font-serif text-[26px] leading-none sm:text-[30px] md:text-[40px]">{profile.label}</span>
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                        selected ? "border-ivory bg-ivory text-ink" : "border-sand",
                      )}
                      aria-hidden="true"
                    >
                      {selected && <CheckIcon size={13} strokeWidth={2} />}
                    </span>
                  </span>
                  <span className={cn("text-[13px]", selected ? "text-ivory/75" : "text-muted")}>
                    {profile.description}
                    <span className="sr-only">{selected ? " (selected)" : ""}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="step-moment" className="shell mt-14">
        <h2 id="step-moment" className="flex items-baseline gap-3">
          <span className="text-[12px] tabular-nums text-faint">02</span>
          <span className="eyebrow text-ink">The moment</span>
          <span className="text-[12px] text-muted">Optional</span>
        </h2>
        <ul className="mt-6 flex flex-wrap gap-2">
          {moods.map((mood) => {
            const selected = moments.includes(mood.slug);
            return (
              <li key={mood.slug}>
                <Link
                  href={href(scents, toggle(moments, mood.slug))}
                  scroll={false}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 border px-5 py-3 text-[14px] transition-colors",
                    selected ? "border-ink bg-ink text-ivory" : "border-line text-ink hover:border-ink",
                  )}
                >
                  {selected && <CheckIcon size={14} />}
                  {mood.label}
                  <span className="sr-only">{selected ? " (selected)" : ""}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="results" aria-labelledby="results-heading" className="shell mt-20 scroll-mt-28 border-t border-line pt-14 md:mt-28">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-muted">Your matches</p>
            <h2 id="results-heading" className="display mt-3 text-[40px] md:text-[56px]" aria-live="polite">
              {!hasSelection
                ? "Choose a character to begin"
                : results.length
                  ? `${results.length} ${results.length === 1 ? "fragrance" : "fragrances"} for you`
                  : "No exact matches"}
            </h2>
          </div>
          {hasSelection && (
            <Link href="/discovery" scroll={false} className="text-[12px] uppercase tracking-[0.16em] text-muted link-reveal hover:text-ink">
              Start again
            </Link>
          )}
        </div>

        {hasSelection && results.length > 0 && <ProductGrid products={results} priorityCount={0} />}

        {hasSelection && results.length === 0 && (
          <div className="max-w-lg">
            <p className="text-[15px] leading-relaxed text-muted">
              Nothing in the collection combines every choice. Try one fewer character or moment, or browse the full
              collection.
            </p>
            <ButtonLink href="/shop" variant="secondary" className="mt-6">
              View all fragrances
            </ButtonLink>
          </div>
        )}

        {!hasSelection && (
          <p className="max-w-lg text-[15px] leading-relaxed text-muted">
            Not sure? Most people start with the character of a place or memory they love: a cool morning is fresh, a
            fireplace is woody, a bakery is sweet.
          </p>
        )}
      </section>
    </div>
  );
}
