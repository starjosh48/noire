import type { NextRequest } from "next/server";
import { updateCartLine } from "@/lib/cart/mutations";
import { cartJson, getMobileContext, readJson } from "@/lib/mobile/context";

type Context = RouteContext<"/api/mobile/cart/items/[itemId]">;

/** Sets a line's quantity. Body: { quantity } (0 removes the line). */
export async function PATCH(request: NextRequest, { params }: Context) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;
  const { itemId } = await params;
  const body = (await readJson(request)) as { quantity?: number } | null;
  const result = await updateCartLine(context, { itemId, quantity: body?.quantity ?? -1 });
  return cartJson(context, result, result.ok ? 200 : 422);
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;
  const { itemId } = await params;
  const result = await updateCartLine(context, { itemId, quantity: 0 });
  return cartJson(context, result, result.ok ? 200 : 422);
}
