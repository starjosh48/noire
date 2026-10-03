import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ApiError, apiFetch } from "~/api/client";
import { useAuth } from "~/auth/auth-provider";
import { supabase } from "~/lib/supabase";
import { calculateTotals, type Cart, type CartLine, type ProductSummary, type QuickVariant } from "~/shared";

/** What a prediction needs to know about the fragrance and size being added. */
export type AddedProduct = Pick<ProductSummary, "id" | "number" | "name" | "slug" | "image_url" | "fragrance_family" | "secondary_family">;
export type AddedVariant = QuickVariant & { sku?: string };

// The cart lives on the server (the same cart the website shows). The app shows server answers,
// and only predicts a change for the moment between a tap and the server's reply.

export const cartKey = ["me", "cart"] as const;

type CartResponse = { ok: boolean; cart?: Cart; error?: string; message?: string };

export function useCart() {
  return useQuery({
    queryKey: cartKey,
    queryFn: async () => (await apiFetch<CartResponse & { cart: Cart }>("/cart")).cart,
  });
}

export function useCartCount() {
  return useCart().data?.itemCount ?? 0;
}

/** Totals for a predicted cart, by the website's own pricing rule. */
export function withTotals(lines: CartLine[]): Cart {
  const subtotal = lines.filter((l) => !l.issue).reduce((sum, l) => sum + l.lineTotal, 0);
  return {
    lines,
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    ...calculateTotals(subtotal),
    hasIssues: lines.some((l) => l.issue),
  };
}

export function predictAdd(cart: Cart, product: AddedProduct, variant: AddedVariant, quantity: number): Cart {
  const existing = cart.lines.find((l) => l.variant.id === variant.id);
  const lines = existing
    ? cart.lines.map((l) =>
        l === existing
          ? { ...l, quantity: Math.min(l.quantity + quantity, l.maxQuantity), lineTotal: l.variant.price * Math.min(l.quantity + quantity, l.maxQuantity) }
          : l,
      )
    : [
        ...cart.lines,
        {
          id: `pending-${variant.id}`,
          quantity,
          product: {
            id: product.id,
            number: product.number,
            name: product.name,
            slug: product.slug,
            image_url: product.image_url,
            fragrance_family: product.fragrance_family,
            secondary_family: product.secondary_family,
          },
          variant: { id: variant.id, size_ml: variant.size_ml, stock_quantity: variant.stock_quantity, sku: variant.sku ?? "", price: Number(variant.price) },
          lineTotal: Number(variant.price) * quantity,
          maxQuantity: Math.max(1, Math.min(variant.stock_quantity, 10)),
          issue: null,
        },
      ];
  return withTotals(lines);
}

export function predictQuantity(cart: Cart, itemId: string, quantity: number): Cart {
  const lines =
    quantity === 0
      ? cart.lines.filter((l) => l.id !== itemId)
      : cart.lines.map((l) => (l.id === itemId ? { ...l, quantity, lineTotal: l.variant.price * quantity } : l));
  return withTotals(lines);
}

type Mutation =
  | { kind: "add"; product: AddedProduct; variant: AddedVariant; quantity: number }
  | { kind: "quantity"; itemId: string; quantity: number };

/**
 * Cart changes. Each shows immediately, then the server's cart replaces the prediction (or the
 * previous cart comes back if the server refused, with its reason).
 */
export function useCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: Mutation) => {
      try {
        if (change.kind === "add") {
          return await apiFetch<CartResponse>("/cart/items", {
            method: "POST",
            body: JSON.stringify({ variantId: change.variant.id, quantity: change.quantity }),
          });
        }
        if (change.quantity === 0) {
          return await apiFetch<CartResponse>(`/cart/items/${change.itemId}`, { method: "DELETE" });
        }
        return await apiFetch<CartResponse>(`/cart/items/${change.itemId}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity: change.quantity }),
        });
      } catch (error) {
        // Refusals (sold out, limits) come back with the server's cart: show it, then the reason.
        const body = error instanceof ApiError ? (error.body as CartResponse | undefined) : undefined;
        if (body?.cart) queryClient.setQueryData(cartKey, body.cart);
        throw error;
      }
    },
    onMutate: async (change) => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previous = queryClient.getQueryData<Cart>(cartKey);
      if (previous) {
        queryClient.setQueryData(
          cartKey,
          change.kind === "add"
            ? predictAdd(previous, change.product, change.variant, change.quantity)
            : predictQuantity(previous, change.itemId, change.quantity),
        );
      }
      return { previous };
    },
    onSuccess: (result) => {
      if (result.cart) queryClient.setQueryData(cartKey, result.cart);
    },
    onError: (error, _change, context) => {
      const body = error instanceof ApiError ? (error.body as CartResponse | undefined) : undefined;
      if (!body?.cart && context?.previous) queryClient.setQueryData(cartKey, context.previous);
    },
    onSettled: () => {
      // Concurrent changes (another tap, another device) settle on the server's latest cart.
      if (queryClient.isMutating() <= 1) void queryClient.invalidateQueries({ queryKey: cartKey });
    },
  });
}

/**
 * Live updates for signed-in customers: Supabase Realtime announces changes to their own cart
 * row (made on the website or another device) and the cart is re-read from the server.
 */
export function useCartRealtime() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refetch = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void queryClient.invalidateQueries({ queryKey: cartKey }), 300);
    };
    const channel = supabase
      .channel(`cart:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "noire_carts", filter: `user_id=eq.${userId}` }, refetch)
      .subscribe((status) => {
        // (Re)connected: catch up on anything missed while the socket was down.
        if (status === "SUBSCRIBED") refetch();
      });
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
