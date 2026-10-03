"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/toast";
import { addToCart, getCartAction, removeCartItem, updateCartItem } from "@/lib/cart/actions";
import type { Cart, CartActionResult } from "@/lib/cart/types";

type CartContextValue = {
  cart: Cart;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Adds a variant; resolves true on success. */
  /**
   * Adds to the cart and confirms with a small "Added to cart · View cart" notice; the shopper
   * stays where they are. `openDrawer` opens the cart instead; `quiet` skips the notice (e.g. Buy now).
   */
  addItem: (variantId: string, quantity: number, options?: { openDrawer?: boolean; quiet?: boolean }) => Promise<boolean>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  replaceCart: (cart: Cart) => void;
  /** False until the visitor's cart has loaded from the server. */
  ready: boolean;
  markReady: () => void;
  /** Re-reads the cart from the server (stock and prices may have changed). */
  refresh: () => Promise<void>;
  pendingItemIds: ReadonlySet<string>;
  lastAddedVariantId: string | null;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export function CartProvider({ initialCart, children }: { initialCart: Cart; children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  const toast = useToast();
  const [cart, setCart] = useState(initialCart);
  const [isOpen, setOpen] = useState(false);
  const [pendingItemIds, setPending] = useState<ReadonlySet<string>>(new Set());
  const [lastAddedVariantId, setLastAdded] = useState<string | null>(null);

  const markPending = useCallback((id: string, pending: boolean) => {
    setPending((current) => {
      const next = new Set(current);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const applyResult = useCallback(
    (result: CartActionResult) => {
      if (result.cart) setCart(result.cart);
      if (!result.ok) toast({ tone: "error", title: "Your cart wasn't updated", description: result.error });
      else if (result.message) toast({ tone: "info", title: "Cart updated", description: result.message });
      return result.ok;
    },
    [toast],
  );

  const addItem = useCallback<CartContextValue["addItem"]>(
    async (variantId, quantity, options) => {
      try {
        const result = await addToCart({ variantId, quantity });
        const ok = applyResult(result);
        if (ok) {
          setLastAdded(variantId);
          if (options?.openDrawer) setOpen(true);
          else if (!options?.quiet && !result.message) {
            const line = result.cart?.lines.find((l) => l.variant.id === variantId);
            toast({
              tone: "success",
              slot: "cart-add",
              title: "Added to cart",
              description: line
                ? `${line.product.name} · ${line.variant.size_ml} ml${quantity > 1 ? ` × ${quantity}` : ""}`
                : undefined,
              action: { label: "View cart", onClick: () => setOpen(true) },
            });
          }
        }
        return ok;
      } catch {
        toast({
          tone: "error",
          title: "Connection problem",
          description: "We couldn't reach NOIRÉ. Check your connection and try again.",
        });
        return false;
      }
    },
    [applyResult, toast],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      markPending(itemId, true);
      try {
        applyResult(await updateCartItem({ itemId, quantity }));
      } catch {
        toast({ tone: "error", title: "Connection problem", description: "Your cart wasn't updated. Please try again." });
      } finally {
        markPending(itemId, false);
      }
    },
    [applyResult, markPending, toast],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      markPending(itemId, true);
      try {
        applyResult(await removeCartItem(itemId));
      } catch {
        toast({ tone: "error", title: "Connection problem", description: "Your cart wasn't updated. Please try again." });
      } finally {
        markPending(itemId, false);
      }
    },
    [applyResult, markPending, toast],
  );

  const refresh = useCallback(async () => {
    try {
      const result = await getCartAction();
      if (result.ok) setCart(result.cart);
    } catch {
      // Keep showing the last known cart; the next action will retry.
    }
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isOpen,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      addItem,
      updateItem,
      removeItem,
      replaceCart: setCart,
      ready,
      markReady,
      refresh,
      pendingItemIds,
      lastAddedVariantId,
    }),
    [cart, isOpen, addItem, updateItem, removeItem, refresh, ready, markReady, pendingItemIds, lastAddedVariantId],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
