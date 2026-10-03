import type { Metadata } from "next";
import { DiscoveryBanner } from "@/components/home/discovery-banner";
import { EditorialFeature } from "@/components/home/editorial-feature";
import { FamilyIndex } from "@/components/home/family-index";
import { Hero } from "@/components/home/hero";
import { MoodGrid } from "@/components/home/mood-grid";
import { ProductRail } from "@/components/home/product-rail";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductCard } from "@/components/product/product-card";
import { ProductGrid } from "@/components/product/product-grid";
import { Reveal } from "@/components/ui/reveal";
import { getBestsellers, getFeaturedProducts } from "@/lib/catalog/queries";
import { siteConfig } from "@/lib/config";

// Served from the edge cache; refreshed in the background at most every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "NOIRÉ | Find the scent that feels like you" },
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [featured, bestsellers] = await Promise.all([getFeaturedProducts(6), getBestsellers(4)]);

  return (
    <>
      <Hero />

      <section aria-labelledby="featured-title" className="shell mt-28 md:mt-40">
        <Reveal>
          <SectionHeading
            id="featured-title"
            eyebrow="Featured"
            title="The current obsessions"
            action={{ href: "/shop", label: "Shop all fragrances" }}
            reserveControls
            className="mb-10"
          />
          <ProductRail label="Featured fragrances">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 44vw, 72vw" />
            ))}
          </ProductRail>
        </Reveal>
      </section>

      <section aria-labelledby="moods-title" className="shell mt-28 md:mt-40">
        <Reveal>
          <SectionHeading
            id="moods-title"
            eyebrow="Explore by mood"
            title="Dress the moment"
            description="Fragrance works best when it matches how you feel. Start with a mood and we'll show you what to wear."
            action={{ href: "/collections", label: "All collections" }}
            className="mb-10"
          />
          <MoodGrid />
        </Reveal>
      </section>

      <section aria-labelledby="bestsellers-title" className="shell mt-28 md:mt-40">
        <Reveal>
          <SectionHeading
            id="bestsellers-title"
            eyebrow="Most loved"
            title="Bestsellers"
            action={{ href: "/shop?sort=bestselling", label: "Shop bestsellers" }}
            className="mb-10"
          />
          <ProductGrid products={bestsellers} priorityCount={0} />
        </Reveal>
      </section>

      <section aria-labelledby="families-title" className="shell mt-28 md:mt-40">
        <Reveal>
          <SectionHeading
            id="families-title"
            eyebrow="Fragrance families"
            title="Learn the language of scent"
            description="Every NOIRÉ fragrance belongs to a family: a shared character you can return to, or a new one to explore."
            className="mb-10"
          />
          <FamilyIndex />
        </Reveal>
      </section>

      <Reveal className="mt-28 md:mt-40">
        <EditorialFeature />
      </Reveal>

      <Reveal className="mt-28 md:mt-40">
        <DiscoveryBanner />
      </Reveal>
    </>
  );
}
