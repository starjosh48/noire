"use client";

import { ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { CartIcon } from "@/components/ui/icons";
import { pluralize } from "@/lib/format";
import { useCart } from "./cart-provider";
import { CartLineItem } from "./cart-line-item";
import { CartTotals } from "./cart-totals";
import { FreeShippingMeter } from "./free-shipping-meter";

export function CartDrawer() {
  const { cart, isOpen, closeCart, ready } = useCart();
  const empty = cart.lines.length === 0;

  return (
    <Drawer
      open={isOpen}
      onClose={closeCart}
      title={empty ? "Your cart" : `Your cart · ${pluralize(cart.itemCount, "item")}`}
      footer={
        empty ? null : (
          <div className="flex flex-col gap-5 px-5 py-6 md:px-7">
            <CartTotals subtotal={cart.subtotal} shippingFee={cart.shippingFee} total={cart.total} />
            {cart.hasIssues && (
              <p className="text-[13px] text-danger">Please update the highlighted items before checking out.</p>
            )}
            <div className="flex flex-col gap-3">
              <ButtonLink
                href="/checkout"
                size="lg"
                fullWidth
                onClick={closeCart}
                aria-disabled={cart.hasIssues || undefined}
                tabIndex={cart.hasIssues ? -1 : undefined}
              >
                Proceed to checkout
              </ButtonLink>
              <button
                type="button"
                onClick={closeCart}
                className="py-2 text-center text-[12px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
              >
                Continue shopping
              </button>
            </div>
          </div>
        )
      }
    >
      {!ready && empty ? (
        <p className="px-8 py-16 text-center text-[14px] text-muted animate-shimmer" role="status">
          Loading your cart…
        </p>
      ) : empty ? (
        <div className="flex h-full flex-col items-center justify-center gap-5 px-8 py-16 text-center">
          <CartIcon size={32} className="text-faint" />
          <div>
            <p className="display text-[30px]">Your cart is empty</p>
            <p className="mt-2 text-[14px] text-muted">Every signature starts with a single spray.</p>
          </div>
          <ButtonLink href="/shop" onClick={closeCart} className="mt-2">
            Explore fragrances
          </ButtonLink>
        </div>
      ) : (
        <div className="px-5 md:px-7">
          <FreeShippingMeter subtotal={cart.subtotal} className="border-b border-line py-5" />
          <ul className="divide-y divide-line">
            {cart.lines.map((line) => (
              <CartLineItem key={line.id} line={line} compact onNavigate={closeCart} />
            ))}
          </ul>
        </div>
      )}
    </Drawer>
  );
}
