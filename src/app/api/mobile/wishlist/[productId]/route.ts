import type { NextRequest } from "next/server";
import { toggleWishlistItem } from "@/lib/account/service";
import { getMobileContext, mobileJson } from "@/lib/mobile/context";

/** Saves or un-saves a fragrance. Responds with { ok, saved }. */
export async function POST(request: NextRequest, { params }: RouteContext<"/api/mobile/wishlist/[productId]">) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;
  const { productId } = await params;
  const result = await toggleWishlistItem(context, productId);
  const status = result.ok ? 200 : result.requiresAuth ? 401 : 422;
  return mobileJson(result, { status });
}
