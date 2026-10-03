import type { NextRequest } from "next/server";
import { getWishlistProducts } from "@/lib/account/queries";
import { getMobileContext, mobileError, mobileJson } from "@/lib/mobile/context";

export async function GET(request: NextRequest) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;
  if (!context.user) return mobileError("Sign in to see your wishlist.", 401, { code: "SIGNED_OUT" });
  return mobileJson({ products: await getWishlistProducts(context) });
}
