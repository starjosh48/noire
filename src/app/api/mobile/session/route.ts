import type { NextRequest } from "next/server";
import { getWishlistProductIds } from "@/lib/account/queries";
import { loadProfile } from "@/lib/auth/session";
import { readCart } from "@/lib/cart/mutations";
import { cartJson, getMobileContext, mobileError } from "@/lib/mobile/context";

/** Everything the app needs on launch: the customer, their profile, cart and saved fragrances. */
export async function GET(request: NextRequest) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;

  // readCart also merges a leftover guest cart into a signed-in customer's cart.
  const [cart, profile, wishlist] = await Promise.all([
    readCart(context),
    loadProfile(context),
    context.user ? getWishlistProductIds(context) : Promise.resolve([]),
  ]);
  if (!cart.ok) return mobileError(cart.error, 500);
  return cartJson(context, { user: context.user, profile, cart: cart.cart, wishlist });
}
