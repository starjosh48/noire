import type { NextRequest } from "next/server";
import { addCartItem } from "@/lib/cart/mutations";
import { cartJson, getMobileContext, readJson } from "@/lib/mobile/context";

/** Adds a size to the cart. Body: { variantId, quantity }. */
export async function POST(request: NextRequest) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;
  const body = (await readJson(request)) as { variantId: string; quantity: number } | null;
  const result = await addCartItem(context, body ?? { variantId: "", quantity: 0 });
  return cartJson(context, result, result.ok ? 200 : 422);
}
