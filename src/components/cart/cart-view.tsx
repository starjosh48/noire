"use client";

import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CartIcon, LockIcon, ReturnIcon, TruckIcon } from "@/components/ui/icons";
import { commerce } from "@/lib/config";
import { pluralize } from "@/lib/format";
import { useCart } from "./cart-provider";
import { CartLineItem } from "./cart-line-item";
import { CartTotals } from "./cart-totals";
import { FreeShippingMeter } from "./free-shipping-meter";

export function CartView() {
  const { cart, refresh } = useCart();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        icon={<CartIcon size={36} />}
        title="Your cart is empty"
        description="Every signature starts with a single spray. Explore the collection, or let us help you find your scent."
        action={
          <>
            <ButtonLink href="/shop">Explore fragrances</ButtonLink>
            <ButtonLink href="/discovery" variant="secondary">
              Discover your scent
            </ButtonLink>
          </>
        }
      />
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <section aria-labelledby="cart-items" className="lg:col-span-7">
        <h2 id="cart-items" className="sr-only">
          Items in your cart
        </h2>
        <FreeShippingMeter subtotal={cart.subtotal} className="border-b border-line pb-6" />
        <ul className="divide-y divide-line border-b border-line">
          {cart.lines.map((line) => (
            <CartLineItem key={line.id} line={line} />
          ))}
        </ul>
      </section>

      <aside aria-labelledby="cart-summary" className="lg:col-span-5">
        <div className="bg-paper p-6 md:p-8 lg:sticky lg:top-28">
          <h2 id="cart-summary" className="eyebrow text-ink">
            Order summary · {pluralize(cart.itemCount, "item")}
          </h2>
          <CartTotals
            className="mt-6"
            subtotal={cart.subtotal}
            shippingFee={cart.shippingFee}
            total={cart.total}
            shippingNote="Nigeria-wide delivery"
          />
          {cart.hasIssues && (
            <p className="mt-5 text-[13px] text-danger" role="alert">
              Some items need your attention before you can check out.
            </p>
          )}
          <ButtonLink
            href="/checkout"
            size="lg"
            fullWidth
            className="mt-6"
            aria-disabled={cart.hasIssues || undefined}
            tabIndex={cart.hasIssues ? -1 : undefined}
          >
            Proceed to checkout
          </ButtonLink>
          <ul className="mt-6 flex flex-col gap-3 text-[13px] text-muted">
            <li className="flex items-center gap-3">
              <TruckIcon size={18} className="shrink-0" /> Lagos 1–2 days · rest of Nigeria 3–5 days
            </li>
            <li className="flex items-center gap-3">
              <LockIcon size={18} className="shrink-0" /> Pay on delivery. Nothing is charged today.
            </li>
            <li className="flex items-center gap-3">
              <ReturnIcon size={18} className="shrink-0" /> Unopened returns within {commerce.returnWindowDays} days
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
