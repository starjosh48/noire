import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/product-grid";
import { CatalogShell } from "@/components/shop/catalog-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { parseFilters, type CatalogFilters } from "@/lib/catalog/filters";
import { getProducts } from "@/lib/catalog/queries";
import { families, moodBySlug, scentProfiles } from "@/lib/catalog/taxonomy";

function headingFor(filters: CatalogFilters) {
  const onlyOne = (list: string[], others: number) => list.length === 1 && others === 0;
  const otherCount = (exclude: keyof CatalogFilters) =>
    (["family", "mood", "scent"] as const).filter((k) => k !== exclude).reduce((n, k) => n + filters[k].length, 0);

  if (onlyOne(filters.mood, otherCount("mood"))) {
    const mood = moodBySlug(filters.mood[0])!;
    return { eyebrow: "Collection", title: mood.label, description: mood.description };
  }
  if (onlyOne(filters.family, otherCount("family"))) {
    const family = families.find((f) => f.slug === filters.family[0])!;
    return { eyebrow: "Fragrance family", title: family.label, description: family.description };
  }
  if (onlyOne(filters.scent, otherCount("scent"))) {
    const scent = scentProfiles.find((s) => s.slug === filters.scent[0])!;
    return { eyebrow: "Scent character", title: scent.label, description: `${scent.description}. Fragrances with a ${scent.label.toLowerCase()} character.` };
  }
  if (filters.sort === "newest" && otherCount("family") + filters.family.length === 0) {
    return { eyebrow: "The collection", title: "New arrivals", description: "The latest additions to the NOIRÉ collection." };
  }
  if (filters.sort === "bestselling" && otherCount("family") + filters.family.length === 0) {
    return { eyebrow: "The collection", title: "Bestsellers", description: "The fragrances our clients return to again and again." };
  }
  return {
    eyebrow: "The collection",
    title: "All Fragrances",
    description: "Twelve eaux de parfum, each composed around a single idea. Available in 30, 50 and 100 ml.",
  };
}

export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
  const heading = headingFor(parseFilters(await searchParams));
  const title = heading.title === "All Fragrances" ? "Shop all fragrances" : `${heading.title} fragrances`;
  return {
    title,
    description: heading.description,
    alternates: { canonical: "/shop" },
    openGraph: { title: `${title} | NOIRÉ`, description: heading.description },
  };
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const filters = parseFilters(await searchParams);
  const products = await getProducts(filters);

  return (
    <div className="pb-24 md:pb-32">
      <CatalogShell filters={filters} total={products.length} heading={headingFor(filters)}>
        {products.length > 0 ? (
          <ProductGrid products={products} label="Fragrances" />
        ) : (
          <EmptyState
            title="Nothing matches just yet"
            description="No fragrances fit every filter you've chosen. Try removing one or two, or start again from the full collection."
            action={
              <ButtonLink href="/shop" variant="secondary">
                View all fragrances
              </ButtonLink>
            }
          />
        )}
      </CatalogShell>
    </div>
  );
}
