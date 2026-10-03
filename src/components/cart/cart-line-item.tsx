"use client";

import Link from "next/link";
import { AlertIcon } from "@/components/ui/icons";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { ProductImage } from "@/components/product/product-image";
import { familyLine } from "@/lib/catalog/taxonomy";
import { formatPrice, productLabel } from "@/lib/format";
import type { CartLine } from "@/lib/cart/types";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-provider";

export function CartLineItem({ line, compact, onNavigate }: { line: CartLine; compact?: boolean; onNavigate?: () => void }) {
  const { updateItem, removeItem, pendingItemIds } = useCart();
  const pending = pendingItemIds.has(line.id);
  const href = `/shop/${line.product.slug}`;
  const soldOut = line.variant.stock_quantity === 0;

  return (
    <li
      className={cn(
        "flex gap-4 py-6 transition-opacity duration-300 md:gap-6",
        pending && "pointer-events-none opacity-50",
      )}
      aria-busy={pending || undefined}
    >
      <Link href={href} onClick={onNavigate} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <ProductImage
          src={line.product.image_url}
          alt=""
          sizes="120px"
          className={cn("aspect-[4/5]", compact ? "w-[84px]" : "w-[96px] md:w-[120px]")}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow text-muted">{productLabel(line.product.number)}</p>
            <Link
              href={href}
              onClick={onNavigate}
              className="mt-1 block font-serif text-[22px] leading-tight text-ink hover:opacity-70"
            >
              {line.product.name}
            </Link>
            <p className="mt-1 text-[13px] text-muted">
              {line.variant.size_ml} ml
              {!compact && <> · {familyLine(line.product.fragrance_family, line.product.secondary_family)}</>}
            </p>
          </div>
          <p className="shrink-0 text-[14px] tabular-nums text-ink">{formatPrice(line.lineTotal)}</p>
        </div>

        {line.issue && (
          <p className="mt-3 flex items-start gap-1.5 text-[13px] text-danger" role="alert">
            <AlertIcon size={15} className="mt-0.5 shrink-0" />
            {line.issue}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          {soldOut ? (
            <span className="text-[13px] text-muted">Unavailable</span>
          ) : (
            <QuantityStepper
              size="sm"
              label={`Quantity of ${line.product.name} ${line.variant.size_ml} ml`}
              value={Math.min(line.quantity, line.maxQuantity)}
              max={line.maxQuantity}
              onChange={(quantity) => updateItem(line.id, quantity)}
              disabled={pending}
            />
          )}
          <button
            type="button"
            onClick={() => removeItem(line.id)}
            className="text-[12px] uppercase tracking-[0.14em] text-muted link-reveal hover:text-ink"
            aria-label={`Remove ${line.product.name} ${line.variant.size_ml} ml from your cart`}
          >
            Remove
          </button>
        </div>
        {!compact && line.quantity > 1 && (
          <p className="mt-2 text-[12px] text-muted">{formatPrice(line.variant.price)} each</p>
        )}
      </div>
    </li>
  );
}
