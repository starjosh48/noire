import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/product/product-grid";
import { SearchIcon } from "@/components/ui/icons";
import { searchProducts } from "@/lib/catalog/queries";
import { pluralize } from "@/lib/format";

const suggestions = ["woody", "amber", "fresh", "floral", "vanilla", "rose", "iris", "after dark"];

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = await searchParams;
  const term = typeof q === "string" ? q.trim() : "";
  return {
    title: term ? `Search results for "${term}"` : "Search",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const term = (typeof q === "string" ? q : "").trim().slice(0, 80);
  const results = term ? await searchProducts(term) : [];

  return (
    <div className="shell pb-24 pt-10 md:pb-32 md:pt-16">
      <p className="eyebrow text-muted">Search</p>
      <form action="/search" role="search" className="mt-4 flex items-center gap-3 border-b border-ink pb-3">
        <label htmlFor="search-page-input" className="sr-only">
          Search fragrances
        </label>
        <SearchIcon size={24} className="shrink-0 text-muted" />
        <input
          id="search-page-input"
          name="q"
          type="search"
          defaultValue={term}
          placeholder="Search by name, note or mood"
          autoComplete="off"
          className="w-full bg-transparent font-serif text-[36px] leading-tight placeholder:text-faint focus:outline-none md:text-[56px]"
        />
        <button type="submit" className="shrink-0 text-[12px] uppercase tracking-[0.16em]">
          Search
        </button>
      </form>

      {term && results.length > 0 && (
        <>
          <h1 className="sr-only">Search results for {term}</h1>
          <p className="mt-6 text-[14px] text-muted" aria-live="polite">
            {pluralize(results.length, "fragrance")} for &ldquo;<span className="text-ink">{term}</span>&rdquo;
          </p>
          <ProductGrid products={results} className="mt-10" label="Fragrances" />
        </>
      )}

      {term && results.length === 0 && (
        <div className="py-20 text-center md:py-28" aria-live="polite">
          <h1 className="display text-[40px] md:text-[56px]">We couldn&rsquo;t find that scent.</h1>
          <p className="mt-3 text-[15px] text-muted">Try searching for woody, amber, fresh, or floral.</p>
          <ul className="mt-8 flex flex-wrap justify-center gap-2">
            {suggestions.slice(0, 4).map((s) => (
              <li key={s}>
                <Link href={`/search?q=${encodeURIComponent(s)}`} className="inline-block border border-line px-4 py-2 text-[13px] capitalize hover:border-ink">
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!term && (
        <div className="mt-10">
          <h1 className="sr-only">Search fragrances</h1>
          <p className="text-[15px] text-muted">Search by fragrance name, family, a note you love, or a mood.</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <li key={s}>
                <Link href={`/search?q=${encodeURIComponent(s)}`} className="inline-block border border-line px-4 py-2 text-[13px] capitalize hover:border-ink">
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
