import "server-only";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { commerce } from "@/lib/config";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateTotals, emptyCart } from "./pricing";
import type { Cart, CartLine } from "./types";

// Carts are server-side. Signed-in customers own one cart (carts.user_id); guests get a cart
// whose random id is kept by the client: an httpOnly cookie on the website, a request header in
// the mobile app. Both are only touched through the service role, after the caller's identity
// has been established here.

export const GUEST_CART_COOKIE = "noire_cart";
const GUEST_CART_MAX_AGE = 60 * 60 * 24 * 60; // 60 days
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCartId(value: string | null | undefined): value is string {
  return !!value && UUID.test(value);
}

/** Where a guest's cart id is kept between requests. */
export type GuestCartStore = {
  read(): Promise<string | null>;
  remember(cartId: string): Promise<void>;
  forget(): Promise<void>;
};

/** Whose cart: a signed-in customer, or a guest identified by their stored cart id. */
export type CartOwner = { user: SessionUser | null; guestStore: GuestCartStore };

/** The website's guest cart cookie. Writes only take effect in Server Actions and Route Handlers. */
export const cookieGuestStore: GuestCartStore = {
  async read() {
    const value = (await cookies()).get(GUEST_CART_COOKIE)?.value;
    return isCartId(value) ? value : null;
  },
  async remember(cartId) {
    (await cookies()).set(GUEST_CART_COOKIE, cartId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GUEST_CART_MAX_AGE,
    });
  },
  async forget() {
    try {
      (await cookies()).delete(GUEST_CART_COOKIE);
    } catch {
      // Read-only context; the stale cookie is ignored for signed-in customers.
    }
  },
};

/** The website visitor's cart owner, from their session and guest cart cookies. */
export async function getWebCartOwner(): Promise<CartOwner> {
  return { user: await getCurrentUser(), guestStore: cookieGuestStore };
}

const CART_ITEM_COLUMNS = `
  id, quantity,
  product:noire_products!inner(id, number, name, slug, image_url, fragrance_family, secondary_family, is_active),
  variant:noire_product_variants!inner(id, size_ml, price, stock_quantity, sku)
`;

type CartItemRow = {
  id: string;
  quantity: number;
  product: CartLine["product"] & { is_active: boolean };
  variant: CartLine["variant"];
};

function toLine(row: CartItemRow): CartLine {
  const { is_active, ...product } = row.product;
  const stock = row.variant.stock_quantity;
  let issue: string | null = null;
  if (!is_active) issue = "This fragrance is no longer available.";
  else if (stock === 0) issue = "This size has just sold out.";
  else if (row.quantity > stock) issue = `Only ${stock} left. Please reduce the quantity.`;

  return {
    id: row.id,
    quantity: row.quantity,
    product,
    variant: { ...row.variant, price: Number(row.variant.price) },
    lineTotal: Number(row.variant.price) * row.quantity,
    maxQuantity: Math.max(1, Math.min(stock, commerce.maxQuantityPerLine)),
    issue,
  };
}

export function summarize(lines: CartLine[]): Cart {
  const orderable = lines.filter((line) => !line.issue);
  const subtotal = orderable.reduce((sum, line) => sum + line.lineTotal, 0);
  return {
    lines,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    ...calculateTotals(subtotal),
    hasIssues: lines.some((line) => line.issue),
  };
}

export async function loadCart(cartId: string | null): Promise<Cart> {
  if (!cartId) return emptyCart();
  const { data, error } = await createAdminClient()
    .from("noire_cart_items")
    .select(CART_ITEM_COLUMNS)
    .eq("cart_id", cartId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[cart] Failed to load cart", error);
    throw new Error("We couldn't load your cart. Please try again.");
  }
  return summarize(((data ?? []) as unknown as CartItemRow[]).map(toLine));
}

async function findUserCartId(userId: string) {
  const { data } = await createAdminClient().from("noire_carts").select("id").eq("user_id", userId).maybeSingle();
  return data?.id ?? null;
}

async function findGuestCartId(guestStore: GuestCartStore) {
  const guestId = await guestStore.read();
  if (!guestId) return null;
  const { data } = await createAdminClient()
    .from("noire_carts")
    .select("id")
    .eq("id", guestId)
    .is("user_id", null)
    .maybeSingle();
  return data?.id ?? null;
}

/** Read-only lookup, safe in Server Components (never writes cookies). */
export async function getCurrentCartId(owner?: CartOwner) {
  const { user, guestStore } = owner ?? (await getWebCartOwner());
  return user ? findUserCartId(user.id) : findGuestCartId(guestStore);
}

export async function getCart(owner?: CartOwner): Promise<Cart> {
  try {
    return await loadCart(await getCurrentCartId(owner));
  } catch (error) {
    unstable_rethrow(error);
    return emptyCart();
  }
}

/**
 * Cart id for a mutation. Only call from Server Actions or Route Handlers (may set cookies).
 * Signed-in customers get any leftover guest cart merged in first.
 */
export async function resolveCartIdForWrite(
  { create }: { create: boolean },
  owner?: CartOwner,
): Promise<string | null> {
  const { user, guestStore } = owner ?? (await getWebCartOwner());
  const admin = createAdminClient();

  if (user) {
    await mergeGuestCartIntoUser(user.id, guestStore);
    const existing = await findUserCartId(user.id);
    if (existing || !create) return existing;
    const { data, error } = await admin
      .from("noire_carts")
      .upsert({ user_id: user.id }, { onConflict: "user_id" })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }

  const existing = await findGuestCartId(guestStore);
  if (existing || !create) return existing;
  const { data, error } = await admin.from("noire_carts").insert({}).select("id").single();
  if (error) throw error;
  await guestStore.remember(data.id);
  return data.id;
}

/**
 * Moves a guest cart into the customer's cart after sign-in. Quantities for the same size are
 * combined, capped by stock and the per-line limit. Only call where the guest store is writable.
 */
export async function mergeGuestCartIntoUser(userId: string, guestStore: GuestCartStore = cookieGuestStore) {
  const guestId = await guestStore.read();
  if (!guestId) return;

  const admin = createAdminClient();
  const forgetGuest = () => guestStore.forget();

  try {
    const { data: guestCart } = await admin
      .from("noire_carts")
      .select("id")
      .eq("id", guestId)
      .is("user_id", null)
      .maybeSingle();
    if (!guestCart) return forgetGuest();

    const userCartId = await findUserCartId(userId);
    if (!userCartId) {
      // Nothing to merge into: the guest cart simply becomes the customer's cart.
      const { error } = await admin
        .from("noire_carts")
        .update({ user_id: userId })
        .eq("id", guestCart.id)
        .is("user_id", null);
      if (error) throw error;
      return forgetGuest();
    }

    const [{ data: guestItems }, { data: userItems }] = await Promise.all([
      admin
        .from("noire_cart_items")
        .select("product_id, product_variant_id, quantity, variant:noire_product_variants!inner(stock_quantity)")
        .eq("cart_id", guestCart.id),
      admin.from("noire_cart_items").select("product_variant_id, quantity").eq("cart_id", userCartId),
    ]);

    const current = new Map((userItems ?? []).map((i) => [i.product_variant_id, i.quantity]));
    const merged = (guestItems ?? []).map((item) => {
      const stock = (item.variant as unknown as { stock_quantity: number }).stock_quantity;
      const combined = (current.get(item.product_variant_id) ?? 0) + item.quantity;
      return {
        cart_id: userCartId,
        product_id: item.product_id,
        product_variant_id: item.product_variant_id,
        quantity: Math.max(1, Math.min(combined, commerce.maxQuantityPerLine, Math.max(stock, 1))),
      };
    });

    if (merged.length) {
      const { error } = await admin.from("noire_cart_items").upsert(merged, { onConflict: "cart_id,product_variant_id" });
      if (error) throw error;
    }
    await admin.from("noire_carts").delete().eq("id", guestCart.id);
    await forgetGuest();
  } catch (error) {
    // Keep the guest cart id so the merge is retried on the next cart action.
    console.error("[cart] Failed to merge guest cart", error);
  }
}
