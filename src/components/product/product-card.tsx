import Image from "next/image";
import Link from "next/link";
import { familyLine } from "@/lib/catalog/taxonomy";
import type { ProductSummary } from "@/lib/catalog/types";
import { formatPrice, productLabel } from "@/lib/format";
import { artwork } from "@/lib/images";
import { cn } from "@/lib/utils";
import { QuickAdd } from "./quick-add";

type ProductCardProps = {
  product: ProductSummary;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

export function ProductCard({
  product,
  priority,
  sizes = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw",
  className,
}: ProductCardProps) {
  const href = `/shop/${product.slug}`;
  const soldOut = product.stock_quantity <= 0;
  const hoverImage = product.gallery_images.find((src) => src !== product.image_url);
  const badge = soldOut ? "Sold out" : product.new_arrival ? "New" : product.bestseller ? "Bestseller" : null;

  return (
    <article className={cn("group relative flex h-full flex-col", className)}>
      <div className="relative aspect-[4/5] overflow-hidden bg-stone">
        {/* The image repeats the text link below, so it's hidden from keyboard and screen readers. */}
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          <Image
            src={artwork(product.image_url)}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            className={cn(
              "object-cover transition-[opacity,scale] duration-[1200ms] ease-out-soft group-hover:scale-[1.03]",
              hoverImage && "group-hover:opacity-0",
            )}
          />
          {hoverImage && (
            <Image
              src={artwork(hoverImage)}
              alt=""
              fill
              sizes={sizes}
              className="hidden scale-[1.04] object-cover opacity-0 pointer-fine:block transition-[opacity,scale] duration-[1200ms] ease-out-soft group-hover:scale-100 group-hover:opacity-100"
            />
          )}
        </Link>
        {badge && (
          <span
            className={cn(
              "pointer-events-none absolute left-3 top-3 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em]",
              soldOut ? "bg-ink text-ivory" : "bg-ivory/90 text-ink",
            )}
          >
            {badge}
          </span>
        )}
        <QuickAdd
          product={{
            name: product.name,
            number: product.number,
            imageUrl: product.image_url,
            family: familyLine(product.fragrance_family, product.secondary_family),
            currency: product.currency,
          }}
          variants={product.variants}
        />
      </div>

      <Link href={href} className="mt-4 flex flex-1 flex-col gap-1 focus-visible:outline-offset-4 md:mt-5">
        <p className="eyebrow text-muted">{productLabel(product.number)}</p>
        <h3 className="font-serif text-[21px] leading-[1.1] text-ink md:text-[24px]">{product.name}</h3>
        <p className="text-[10px] uppercase tracking-[0.16em] text-faint md:text-[11px]">
          {familyLine(product.fragrance_family, product.secondary_family)}
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted md:line-clamp-1">
          {product.short_description}
        </p>
        <p className="mt-2 text-[13px] tabular-nums text-ink md:text-[14px]">
          <span className="text-muted">From </span>
          {formatPrice(product.price, product.currency)}
        </p>
      </Link>
    </article>
  );
}
