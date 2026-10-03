import type { Metadata } from "next";
import { FamilyIndex } from "@/components/home/family-index";
import { MoodGrid } from "@/components/home/mood-grid";
import { getProducts } from "@/lib/catalog/queries";
import { emptyFilters } from "@/lib/catalog/filters";

// Served from the edge cache; refreshed in the background at most every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Collections",
  description: "Explore NOIRÉ by mood (After Dark, Fresh Start, Date Night and more) or by fragrance family.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  const products = await getProducts(emptyFilters);
  const counts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.fragrance_family] = (acc[p.fragrance_family] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="pb-24 md:pb-32">
      <header className="shell pt-10 md:pt-16">
        <p className="eyebrow text-muted">Collections</p>
        <h1 className="display mt-3 max-w-4xl text-[52px] md:text-[96px]">A fragrance for every version of you</h1>
        <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-muted">
          Browse by the moment you&rsquo;re dressing for, or by the family of notes you already love.
        </p>
      </header>

      <section aria-labelledby="moods-heading" className="shell mt-16 md:mt-24">
        <h2 id="moods-heading" className="eyebrow mb-6 text-ink">
          By mood
        </h2>
        <MoodGrid />
      </section>

      <section id="families" aria-labelledby="families-heading" className="shell mt-24 scroll-mt-32 md:mt-36">
        <div className="mb-10 max-w-2xl">
          <h2 id="families-heading" className="display text-[40px] md:text-[56px]">
            By fragrance family
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Families describe a fragrance&rsquo;s core character. If you love one fragrance, you&rsquo;ll often love
            others from the same family.
          </p>
        </div>
        <FamilyIndex counts={counts} />
      </section>
    </div>
  );
}
