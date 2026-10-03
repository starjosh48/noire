import type { ProductSummary } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  className,
  priorityCount = 4,
  label,
}: {
  products: ProductSummary[];
  className?: string;
  priorityCount?: number;
  /** Screen-reader heading for grids that sit directly under the page's h1 (cards use h3). */
  label?: string;
}) {
  return (
    <>
      {label && <h2 className="sr-only">{label}</h2>}
      <ul
        className={cn(
          "grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 md:gap-y-16 lg:grid-cols-4",
          className,
        )}
      >
        {products.map((product, index) => (
          <li key={product.id} className="animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}>
            <ProductCard product={product} priority={index < priorityCount} />
          </li>
        ))}
      </ul>
    </>
  );
}
