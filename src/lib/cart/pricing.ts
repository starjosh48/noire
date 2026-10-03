import { commerce } from "@/lib/config";
import type { Cart } from "./types";

/**
 * Shipping rule shared by the cart preview and the order function (which receives these
 * constants from the server and recomputes the subtotal from catalog prices).
 */
export function calculateTotals(subtotal: number) {
  const qualifiesForFreeShipping = subtotal >= commerce.freeShippingThreshold;
  const shippingFee = subtotal === 0 || qualifiesForFreeShipping ? 0 : commerce.shippingFee;
  return {
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    freeShippingRemaining: Math.max(0, commerce.freeShippingThreshold - subtotal),
  };
}

export function emptyCart(): Cart {
  return { lines: [], itemCount: 0, ...calculateTotals(0), hasIssues: false };
}
