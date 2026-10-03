"use client";

import type { ReactNode } from "react";
import { useCart } from "./cart-provider";

/** Opens the cart drawer in place (instead of navigating to a separate cart page). */
export function OpenCartButton({ children, className }: { children: ReactNode; className?: string }) {
  const { openCart } = useCart();
  return (
    <button type="button" onClick={openCart} aria-haspopup="dialog" className={className}>
      {children}
    </button>
  );
}
