"use client";

import { useCart } from "@/components/cart/cart-provider";
import { CartTotals } from "@/components/cart/cart-totals";
import { FreeShippingMeter } from "@/components/cart/free-shipping-meter";
import { ProductImage } from "@/components/product/product-image";
import { ChevronDownIcon } from "@/components/ui/icons";
import { formatPrice, pluralize, productLabel } from "@/lib/format";

function Lines() {
  const { cart } = useCart();
  return (
    <ul className="flex flex-col gap-5">
      {cart.lines.map((line) => (
        <li key={line.id} className="flex items-center gap-4">
          <div className="relative shrink-0">
            <ProductImage src={line.product.image_url} alt="" sizes="72px" className="aspect-[4/5] w-16" />
            <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-ink text-[10px] tabular-nums text-ivory">
              {line.quantity}
              <span className="sr-only"> × </span>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-muted">{productLabel(line.product.number)}</p>
            <p className="truncate font-serif text-[19px] leading-tight">{line.product.name}</p>
            <p className="text-[12px] text-muted">
              {line.variant.size_ml} ml · Qty {line.quantity}
            </p>
            {line.issue && <p className="mt-1 text-[12px] text-danger">{line.issue}</p>}
          </div>
          <p className="text-[14px] tabular-nums">{formatPrice(line.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}

export function OrderSummary() {
  const { cart } = useCart();
  const totals = (
    <CartTotals subtotal={cart.subtotal} shippingFee={cart.shippingFee} total={cart.total} />
  );

  return (
    <>
      {/* Mobile: collapsible summary */}
      <details className="group border-y border-line lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[14px] [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <span className="group-open:hidden">Show order summary</span>
            <span className="hidden group-open:inline">Hide order summary</span>
            <ChevronDownIcon size={16} className="transition-transform group-open:rotate-180" />
          </span>
          <span className="font-medium tabular-nums">{formatPrice(cart.total)}</span>
        </summary>
        <div className="flex flex-col gap-6 pb-6">
          <Lines />
          {totals}
        </div>
      </details>

      {/* Desktop: sticky panel */}
      <section aria-labelledby="summary-title" className="hidden bg-paper p-8 lg:sticky lg:top-28 lg:block">
        <h2 id="summary-title" className="eyebrow text-ink">
          Order summary · {pluralize(cart.itemCount, "item")}
        </h2>
        <div className="mt-6 max-h-[42vh] overflow-y-auto pr-1 pt-2">
          <Lines />
        </div>
        <FreeShippingMeter subtotal={cart.subtotal} className="mt-6 border-t border-line pt-6" />
        <div className="mt-6 border-t border-line pt-6">{totals}</div>
      </section>
    </>
  );
}
