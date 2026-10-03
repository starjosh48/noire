import type { NextRequest } from "next/server";
import { readCart } from "@/lib/cart/mutations";
import { cartJson, getMobileContext } from "@/lib/mobile/context";

export async function GET(request: NextRequest) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;
  const result = await readCart(context);
  return cartJson(context, result, result.ok ? 200 : 500);
}
