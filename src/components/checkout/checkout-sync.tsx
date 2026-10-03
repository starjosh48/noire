"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-provider";
import type { Cart } from "@/lib/cart/types";

/** Aligns the client cart with the freshly loaded server cart when checkout opens. */
export function CheckoutSync({ cart }: { cart: Cart }) {
  const { replaceCart } = useCart();
  useEffect(() => {
    replaceCart(cart);
  }, [cart, replaceCart]);
  return null;
}
