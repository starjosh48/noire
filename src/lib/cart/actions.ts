"use server";

import { after } from "next/server";
import { z } from "zod";
import { commerce } from "@/lib/config";
import { releaseAbandonedCheckouts } from "@/lib/orders/maintenance";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadCart, resolveCartIdForWrite } from "./service";
import type { CartActionResult } from "./types";

const GENERIC_ERROR = "Something went wrong updating your cart. Please try again.";

const addSchema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(1).max(commerce.maxQuantityPerLine),
});

const updateSchema = z.object({
  itemId: z.uuid(),
  quantity: z.number().int().min(0).max(commerce.maxQuantityPerLine),
});

export async function getCartAction(): Promise<CartActionResult> {
  try {
    const cartId = await resolveCartIdForWrite({ create: false });
    return { ok: true, cart: await loadCart(cartId) };
  } catch (error) {
    console.error("[cart] getCartAction", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function addToCart(input: { variantId: string; quantity: number }): Promise<CartActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please choose a size and quantity." };
  const { variantId, quantity } = parsed.data;
  // Shoppers adding to cart are who need accurate stock: free up abandoned checkouts in the background.
  after(releaseAbandonedCheckouts);

  try {
    const admin = createAdminClient();
    const { data: variant, error: variantError } = await admin
      .from("noire_product_variants")
      .select("id, size_ml, stock_quantity, product:noire_products!inner(id, name, is_active)")
      .eq("id", variantId)
      .maybeSingle();
    if (variantError) throw variantError;

    const product = variant?.product as unknown as { id: string; name: string; is_active: boolean } | undefined;
    if (!variant || !product?.is_active) {
      return { ok: false, error: "This fragrance is no longer available." };
    }
    if (variant.stock_quantity <= 0) {
      return { ok: false, error: `${product.name} in ${variant.size_ml} ml is sold out.` };
    }

    const cartId = await resolveCartIdForWrite({ create: true });
    if (!cartId) throw new Error("Cart could not be created");

    const { data: existing } = await admin
      .from("noire_cart_items")
      .select("quantity")
      .eq("cart_id", cartId)
      .eq("product_variant_id", variantId)
      .maybeSingle();

    const inCart = existing?.quantity ?? 0;
    const limit = Math.min(variant.stock_quantity, commerce.maxQuantityPerLine);
    if (inCart >= limit) {
      const error =
        variant.stock_quantity <= commerce.maxQuantityPerLine
          ? `All ${variant.stock_quantity} available are already in your cart.`
          : `You can add up to ${commerce.maxQuantityPerLine} of each size.`;
      return { ok: false, error, cart: await loadCart(cartId) };
    }

    const next = Math.min(inCart + quantity, limit);
    const { error } = await admin
      .from("noire_cart_items")
      .upsert(
        { cart_id: cartId, product_id: product.id, product_variant_id: variantId, quantity: next },
        { onConflict: "cart_id,product_variant_id" },
      );
    if (error) throw error;

    const added = next - inCart;
    return {
      ok: true,
      cart: await loadCart(cartId),
      message: added < quantity ? `Only ${added} more available. We've added what's left.` : undefined,
    };
  } catch (error) {
    console.error("[cart] addToCart", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function updateCartItem(input: { itemId: string; quantity: number }): Promise<CartActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please choose a valid quantity." };
  const { itemId, quantity } = parsed.data;

  try {
    const cartId = await resolveCartIdForWrite({ create: false });
    if (!cartId) return { ok: false, error: "Your cart has expired. Please add the fragrance again." };
    const admin = createAdminClient();

    if (quantity === 0) {
      const { error } = await admin.from("noire_cart_items").delete().eq("id", itemId).eq("cart_id", cartId);
      if (error) throw error;
      return { ok: true, cart: await loadCart(cartId) };
    }

    const { data: item } = await admin
      .from("noire_cart_items")
      .select("id, variant:noire_product_variants!inner(stock_quantity)")
      .eq("id", itemId)
      .eq("cart_id", cartId)
      .maybeSingle();
    if (!item) return { ok: false, error: "That item is no longer in your cart.", cart: await loadCart(cartId) };

    const stock = (item.variant as unknown as { stock_quantity: number }).stock_quantity;
    if (stock <= 0) {
      return { ok: false, error: "This size has just sold out.", cart: await loadCart(cartId) };
    }
    const next = Math.min(quantity, stock, commerce.maxQuantityPerLine);
    const { error } = await admin.from("noire_cart_items").update({ quantity: next }).eq("id", itemId).eq("cart_id", cartId);
    if (error) throw error;

    return {
      ok: true,
      cart: await loadCart(cartId),
      message: next < quantity ? `Only ${stock} available in this size.` : undefined,
    };
  } catch (error) {
    console.error("[cart] updateCartItem", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function removeCartItem(itemId: string): Promise<CartActionResult> {
  return updateCartItem({ itemId, quantity: 0 });
}
