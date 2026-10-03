import { NextResponse } from "next/server";
import { getWishlistProductIds } from "@/lib/account/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { getCart } from "@/lib/cart/service";

/**
 * Per-visitor state, loaded by the browser so every catalog page can be served from the cache:
 * who is signed in, their cart, and their saved fragrances.
 */
export async function GET() {
  const user = await getCurrentUser();
  const [cart, wishlist] = await Promise.all([getCart(), user ? getWishlistProductIds() : Promise.resolve([])]);
  return NextResponse.json(
    { user, cart, wishlist },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
